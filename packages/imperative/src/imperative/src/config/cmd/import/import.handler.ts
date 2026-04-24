/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL, URL } from "url";
import * as JSONC from "comment-json";
import { ICommandHandler, IHandlerParameters } from "../../../../../cmd";
import { ImperativeError } from "../../../../../error";
import { ImperativeConfig, TextUtils } from "../../../../../utilities";
import * as lodash from "lodash";
import { ConfigConstants, IConfig, IConfigLayer } from "../../../../../config";
import { AuthOrder, RestClient, Session, SessConstants } from "../../../../../rest";

/**
 * Import config
 */
export default class ImportHandler implements ICommandHandler {
    private params: IHandlerParameters;

    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        this.params = params;

        // Load the config and set the active layer according to user options
        const config = ImperativeConfig.instance.config;
        const configDir = params.arguments.globalConfig ? null : process.cwd();
        config.api.layers.activate(params.arguments.userConfig, params.arguments.globalConfig, configDir);
        const layer = config.api.layers.get();

        const isDryRun = params.arguments.dryRun as boolean;
        const isMerge = params.arguments.merge as boolean;
        const isOverwrite = params.arguments.overwrite as boolean;

        if (isMerge && isOverwrite) {
            throw new ImperativeError({
                msg: "The --merge and --overwrite options are mutually exclusive. " +
                    "Use --merge to add missing properties to an existing config, " +
                    "or --overwrite to replace it entirely."
            });
        }

        // Guard: skip when the file already exists and neither --overwrite, --merge, nor --dry-run is given
        if (layer.exists && !isOverwrite && !isMerge && !isDryRun) {
            params.response.console.log(
                `Skipping import because ${layer.path} already exists.\n` +
                `Rerun the command with --overwrite to replace it, --merge to add missing ` +
                `properties, or --dry-run to preview what would happen.`
            );
            return;
        }

        const configFilePath = path.resolve(params.arguments.location);
        const isConfigLocal = fs.existsSync(configFilePath) || path.isAbsolute(params.arguments.location);
        // Typecasting because of this issue: https://github.com/kaelzhang/node-comment-json/issues/42
        const configJson: IConfig = isConfigLocal ?
            JSONC.parse(fs.readFileSync(configFilePath, "utf-8")) as any :
            await this.fetchConfig(new URL(params.arguments.location));

        // Apply the incoming config to the active layer
        let previewLayer: IConfigLayer | undefined;
        if (isMerge && layer.exists) {
            // Safe merge: existing target values always win over incoming imported values.
            // We operate on a clone for dry-run so nothing is mutated on disk.
            const target: IConfigLayer = isDryRun
                ? JSONC.parse(JSONC.stringify(layer, null, ConfigConstants.INDENT)) as unknown as IConfigLayer
                : config.api.layers.get();

            // profiles: deep-merge with existing winning — lodash.mergeWith(existing, incoming)
            target.properties.profiles = lodash.mergeWith(
                {},
                configJson.profiles,       // imported (lower priority, applied first)
                target.properties.profiles, // existing (higher priority, applied second — wins)
                (existingVal: any, _importedVal: any) => {
                    // For arrays, keep the existing array as-is
                    if (lodash.isArray(existingVal)) { return existingVal; }
                }
            );

            // defaults: existing key/value pairs win; only add keys missing from target
            target.properties.defaults = {
                ...configJson.defaults,        // imported base
                ...target.properties.defaults  // existing overrides (wins on conflict)
            };

            // plugins: add any new plugins from the import not already present
            for (const plugin of configJson.plugins ?? []) {
                if (target.properties.plugins == null) {
                    target.properties.plugins = [plugin];
                } else if (!target.properties.plugins.includes(plugin)) {
                    target.properties.plugins.push(plugin);
                }
            }

            // autoStore: only set if target does not already define it
            if (target.properties.autoStore == null && configJson.autoStore != null) {
                target.properties.autoStore = configJson.autoStore;
            }

            if (isDryRun) {
                previewLayer = target;
            } else {
                config.api.layers.set(target.properties);
            }
        } else if (isDryRun) {
            // Overwrite dry-run: build a clone of the layer with the incoming config applied
            previewLayer = JSONC.parse(JSONC.stringify(layer, null, ConfigConstants.INDENT)) as unknown as IConfigLayer;
            previewLayer.properties = configJson;
            previewLayer.properties.defaults = previewLayer.properties.defaults ?? {};
            previewLayer.properties.profiles = previewLayer.properties.profiles ?? {};
        } else {
            // Normal import (first-time or --overwrite)
            config.api.layers.set(configJson);
        }

        // Import schema alongside the config (skip during dry-run — no side effects)
        let schemaImported = false;
        if (!isDryRun && configJson.$schema?.startsWith("./")) {  // Only import schema if relative path
            const schemaUri = new URL(configJson.$schema,
                isConfigLocal ? pathToFileURL(configFilePath) : params.arguments.location);
            const schemaFilePath = path.resolve(path.dirname(layer.path), configJson.$schema);
            try {
                await this.downloadSchema(schemaUri, schemaFilePath);
                schemaImported = true;
            } catch (error) {
                params.response.console.error(TextUtils.chalk.yellow("Warning:") +
                    ` Failed to download schema\n${error.message}\n`);
            }
        }

        if (isDryRun) {
            // Print a preview of the would-be result without touching disk
            params.response.console.log(
                TextUtils.chalk.yellow("[Dry Run]") +
                ` The following config would be written to ${layer.path}:\n`
            );
            params.response.console.log(
                JSONC.stringify((previewLayer as IConfigLayer).properties, null, ConfigConstants.INDENT)
            );
            params.response.console.log("\nNo changes were written to disk. Remove --dry-run to apply.");
        } else {
            // Write the active created/updated config layer
            config.api.layers.write();
            const action = isMerge && layer.exists ? "Merged config" : "Imported config";
            params.response.console.log(`${action}${schemaImported ? " and schema" : ""} to ${layer.path}`);
        }
    }

    /**
     * Build a session from a URL and command line arguments.
     * @param url Web URL of the config JSON file
     * @returns Populated session object
     */
    private buildSession(url: URL): Session {
        let session = Session.createFromUrl(url, false);

        if (this.params.arguments.user != null && this.params.arguments.password != null) {
            const { protocol, hostname, port } = session.ISession;
            session = new Session({
                protocol, hostname, port,
                type: SessConstants.AUTH_TYPE_BASIC,
                user: this.params.arguments.user,
                password: this.params.arguments.password
            });
        }
        AuthOrder.addCredsToSession(session.ISession, this.params.arguments);
        session.ISession.rejectUnauthorized = this.params.arguments.rejectUnauthorized;
        return session;
    }

    /**
     * Download the config from a URL
     * @param url Web URL of the config JSON file
     * @returns Parsed config object
     */
    private async fetchConfig(url: URL): Promise<IConfig> {
        const response = await RestClient.getExpectString(this.buildSession(url), url.pathname);
        try {
            // Typecasting because of this issue: https://github.com/kaelzhang/node-comment-json/issues/42
            return JSONC.parse(response) as any;
        } catch (error) {
            throw new ImperativeError({
                msg: "Failed to parse config JSON: URL must point to a valid JSON file\n" + error.message,
                causeErrors: error
            });
        }
    }

    /**
     * Download the config schema from a URL to disk
     * @param url Web URL of the schema JSON file
     * @param filePath Local path to download to
     */
    private async downloadSchema(url: URL, filePath: string): Promise<void> {
        if (url.protocol === "file:") {
            fs.copyFileSync(fileURLToPath(url), filePath);
        } else {
            const response = await RestClient.getExpectString(this.buildSession(url), url.pathname);
            try {
                // Typecasting because of this issue: https://github.com/kaelzhang/node-comment-json/issues/42
                JSONC.parse(response) as any;
            } catch (error) {
                throw new ImperativeError({
                    msg: "Failed to parse schema JSON: URL must point to a valid JSON file\n" + error.message,
                    causeErrors: error
                });
            }
            fs.writeFileSync(filePath, response);
        }
    }
}
