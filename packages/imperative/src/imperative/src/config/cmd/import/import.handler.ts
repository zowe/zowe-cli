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
import { IConfig } from "../../../../../config";
import { RestClient, Session, SessConstants } from "../../../../../rest";

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

        if (layer.exists && !params.arguments.overwrite) {
            params.response.console.log(`Skipping import because ${layer.path} already exists.\n` +
                `Rerun the command with the --overwrite flag to import anyway.`);
            return;
        }

        const configFilePath = path.resolve(params.arguments.location);
        const isConfigLocal = fs.existsSync(configFilePath) || path.isAbsolute(params.arguments.location);
        const configJson: IConfig = isConfigLocal ?
            JSONC.parse(fs.readFileSync(configFilePath, "utf-8")) :
            await this.fetchConfig(new URL(params.arguments.location));
        config.api.layers.set(configJson);

        let schemaImported = false;
        if (configJson.$schema?.startsWith("./")) {  // Only import schema if relative path
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

        // Write the active created/updated config layer
        config.api.layers.write();

        params.response.console.log(`Imported config${schemaImported ? " and schema" : ""} to ${layer.path}`);
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
            return JSONC.parse(response);
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
                JSONC.parse(response);
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
