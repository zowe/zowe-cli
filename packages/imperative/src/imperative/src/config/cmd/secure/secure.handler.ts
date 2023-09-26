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

import { ICommandArguments, ICommandHandler, IHandlerParameters } from "../../../../../cmd";
import { Config, ConfigAutoStore, ConfigConstants, ConfigSchema } from "../../../../../config";
import { coercePropValue, secureSaveError } from "../../../../../config/src/ConfigUtils";
import { ImperativeError } from "../../../../../error";
import { Logger } from "../../../../../logger";
import { ConnectionPropsForSessCfg, ISession, Session } from "../../../../../rest";
import { ImperativeConfig } from "../../../../../utilities";

export default class SecureHandler implements ICommandHandler {
    /**
     * The parameters object passed to the command handler.
     */
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
        const config = ImperativeConfig.instance.config;

        // Setup the credential vault API for the config
        if (config.api.secure.loadFailed) {
            throw secureSaveError();
        }

        if (params.arguments.prune) {
            const prunedFiles = config.api.secure.rmUnusedProps();
            if (prunedFiles.length > 0) {
                await config.api.secure.directSave();
                params.response.console.log("Deleted secure properties for the following missing files:\n\t" + prunedFiles.join("\n\t") + "\n");
            }
        }

        // Create the config, load the secure values, and activate the desired layer
        config.api.layers.activate(params.arguments.userConfig, params.arguments.globalConfig);
        const secureProps: string[] = config.api.secure.secureFields();

        if (secureProps.length === 0) {
            params.response.console.log("No secure properties found in your config");
            return;
        }

        // Prompt for values designated as secure
        for (const propName of secureProps) {
            if (propName.endsWith(".tokenValue")) {
                params.response.console.log(`Processing secure properties for profile: ${config.api.profiles.getProfileNameFromPath(propName)}`);
                let propValue = await this.handlePromptForAuthToken(config, propName);
                if (propValue === undefined) {
                    propValue = await params.response.console.prompt(`Enter ${propName} ${ConfigConstants.SKIP_PROMPT}`, {hideText: true});
                }

                // Save the value in the config securely
                if (propValue) {
                    config.set(propName, propValue, { secure: true });
                }
            } else {
                let propValue = await params.response.console.prompt(`Enter ${propName} ${ConfigConstants.SKIP_PROMPT}`, { hideText: true });

                // Save the value in the config securely
                if (propValue) {
                    propValue = coercePropValue(propValue, ConfigSchema.findPropertyType(propName, config.properties));
                    config.set(propName, propValue, { secure: true });
                }
            }
        }

        // Write the config layer
        await config.save();
    }

    /**
     * Checks if authentication service is associated with an auth token
     * property. If an auth service is found, we log in to it obtain the token
     * instead of prompting for the value.
     * @param config Team config class from which the property was loaded
     * @param propPath JSON property path of the auth token
     * @returns Token value, or undefined if none was obtained
     */
    private async handlePromptForAuthToken(config: Config, propPath: string): Promise<string | undefined> {
        const profilePath = propPath.slice(0, propPath.indexOf(".properties"));
        const authHandlerClass = ConfigAutoStore.findAuthHandlerForProfile(profilePath, this.params.arguments);

        if (authHandlerClass != null) {
            const api = authHandlerClass.getAuthHandlerApi();
            if (api.promptParams.serviceDescription != null) {
                this.params.response.console.log(`Logging in to ${api.promptParams.serviceDescription} ${ConfigConstants.SKIP_PROMPT}`);
            }

            const profile = config.api.profiles.get(profilePath.replace(/profiles\./g, ""), false);
            const sessCfg: ISession = api.createSessCfg(profile as ICommandArguments);
            const sessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt(sessCfg, profile as ICommandArguments,
                { parms: this.params, doPrompting: true, requestToken: true, ...api.promptParams });
            Logger.getAppLogger().info(`Fetching ${profile.tokenType} for ${propPath}`);

            if (ConnectionPropsForSessCfg.sessHasCreds(sessCfgWithCreds)) {
                try {
                    const tokenValue = await api.sessionLogin(new Session(sessCfgWithCreds));
                    this.params.response.console.log("Logged in successfully");
                    return tokenValue;
                } catch (error) {
                    throw new ImperativeError({
                        msg: `Failed to fetch ${profile.tokenType} for ${propPath}: ${error.message}`,
                        causeErrors: error
                    });
                }
            } else {
                this.params.response.console.log("No credentials provided.");
                // return null to avoid propting for .tokenValue for this profile
                return null;
            }
        }
    }
}
