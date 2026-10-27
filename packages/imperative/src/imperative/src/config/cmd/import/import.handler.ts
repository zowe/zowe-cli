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
import { CliUtils, GuiResult, ImperativeConfig, ProcessUtils, TextUtils } from "../../../../../utilities";
import { IConfig } from "../../../../../config";
import { RestClient, Session, SessConstants } from "../../../../../rest";
import { IO } from "../../../../../io";

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

        const location: string = params.arguments.location;
        const parsedUrl = URL.canParse(location) ? new URL(location) : null;
        const isHttp = parsedUrl && (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:");
        const configUrl = isHttp ? parsedUrl : null;
        const configFilePath = configUrl ? null : path.resolve(location);
        const configJson: IConfig = configUrl ?
            await this.fetchConfig(configUrl) :
            JSONC.parse(fs.readFileSync(configFilePath, "utf-8"));
        config.api.layers.set(configJson);

        let schemaImported = false;
        // Only import schema if relative path and no backtracking
        if (configJson.$schema && configJson.$schema.startsWith("./") && !IO.containsBacktrack(configJson.$schema)) {
            const schemaUri = new URL(configJson.$schema,
                configUrl ?? pathToFileURL(configFilePath));
            const schemaFilePath = path.resolve(path.dirname(layer.path), configJson.$schema);
            try {
                schemaImported = await this.downloadSchema(schemaUri, schemaFilePath);
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
    private async downloadSchema(url: URL, filePath: string): Promise<boolean> {
        if (url.protocol === "file:") {
            fs.copyFileSync(fileURLToPath(url), filePath);
            return true;
        } else {
            const response = await RestClient.getExpectString(this.buildSession(url), url.pathname);
            let parsedSchema: any;
            try {
                parsedSchema = JSONC.parse(response);
            } catch (error) {
                throw new ImperativeError({
                    msg: "Failed to parse schema JSON: URL must point to a valid JSON file\n" + error.message,
                    causeErrors: error
                });
            }
            if (!Object.keys(parsedSchema).includes('$schema') || typeof parsedSchema['$schema'] !== "string") {
                throw new ImperativeError({
                    msg: `The schema downloaded from ${url} appears to be malformed. It does not contain a '$schema' field.`
                });
            }
            if (IO.existsSync(filePath) && ProcessUtils.isGuiAvailable() === GuiResult.GUI_AVAILABLE) {
                let input: string | null = null;
                do {
                    input = await CliUtils.readPrompt(`${filePath} already exists. Overwrite it with the schema downloaded from '${url}'?`);
                } while (input != null && input.toLowerCase() !== "y" && input.toLowerCase() !== "n");

                if (input?.toLowerCase() != "y") {
                    return false;
                }
            }
            fs.writeFileSync(filePath, response);
            return true;
        }
    }
}
