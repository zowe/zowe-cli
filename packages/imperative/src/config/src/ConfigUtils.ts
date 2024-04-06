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

import { homedir as osHomedir } from "os";
import { normalize as pathNormalize, join as pathJoin } from "path";
import { existsSync as fsExistsSync } from "fs";

import { CredentialManagerFactory } from "../../security/src/CredentialManagerFactory";
import { ICommandArguments } from "../../cmd";
import { ImperativeConfig } from "../../utilities";
import { ImperativeError } from "../../error";
import { LoggerManager } from "../../logger/src/LoggerManager";
import { LoggingConfigurer } from "../../imperative/src/LoggingConfigurer";
import { Logger } from "../../logger/src/Logger";
import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";

export class ConfigUtils {
    /**
     * Coerces string property value to a boolean or number type.
     * @param value String value
     * @param type Property type defined in the schema
     * @returns Boolean, number, or string
     */
    public static coercePropValue(value: any, type?: string) {
        if (type === "boolean" || type === "number") {
            // For boolean or number, parse the string and throw on failure
            return JSON.parse(value);
        } else if (type == null) {
            // For unknown type, try to parse the string and ignore failure
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } else {
            // For string or other type, don't do any parsing
            return value.toString();
        }
    }

    /**
     * Retrieves the name of the active profile for the given type. If no such
     * profile exists, returns the default name which can be used to create a new profile.
     * @param profileType The type of CLI profile
     * @param cmdArguments CLI arguments which may specify a profile
     * @param defaultProfileName Name to fall back to if profile doesn't exist. If
     *                           not specified, the profile type will be used.
     * @returns The profile name
     */
    public static getActiveProfileName(profileType: string, cmdArguments?: ICommandArguments, defaultProfileName?: string): string {
        // Look for profile name first in command line arguments, second in
        // default profiles defined in config, and finally fall back to using
        // the profile type as the profile name.
        return cmdArguments?.[`${profileType}-profile`] ||
            ImperativeConfig.instance.config?.properties.defaults[profileType] ||
            defaultProfileName || profileType;
    }

    /**
     * Checks if partial path is equal to or nested inside full path
     * @param fullPath JSON path to profile 1
     * @param partialPath JSON path to profile 2
     */
    public static jsonPathMatches(fullPath: string, partialPath: string): boolean {
        return fullPath === partialPath || fullPath.startsWith(partialPath + ".profiles.");
    }

    /**
     * Returns an indicator that the user has no team configuration, but we
     * detected the existence of old-school V1 profiles. We will not work with the
     * V1 profiles. This function can let you tell a user that they are incorrectly
     * trying to use V1 profiles.
     *
     * @returns True - Means there is *NO* team config *AND* we detected that a V1 profile exists.
     *          False otherwise.
     */
    public static get onlyV1ProfilesExist(): boolean {
        if (ImperativeConfig.instance.config?.exists) {
            // we have a team config
            return false;
        }

        let v1ZosmfProfileFileNm: string;
        try {
            v1ZosmfProfileFileNm = pathNormalize(ImperativeConfig.instance.cliHome + "/profiles/zosmf/zosmf_meta.yaml");
        } catch (_thrownErr) {
            // We failed to get the CLI home directory. So, we definitely have no V1 profiles.
            return false;
        }

        if (fsExistsSync(v1ZosmfProfileFileNm)) {
            // we found V1 profiles
            return true;
        }

        return false;
    }

    /**
     * Form an error message for failures to securely save a value.
     * @param solution Text that our caller can supply for a solution.
     * @returns ImperativeError to be thrown
     */
    public static secureSaveError(solution?: string): ImperativeError {
        let details = CredentialManagerFactory.manager.secureErrorDetails();
        if (solution != null) {
            details = (details != null) ? (details + `\n - ${solution}`) : solution;
        }
        return new ImperativeError({
            msg: "Unable to securely save credentials.",
            additionalDetails: details
        });
    }


    // _______________________________________________________________________
    /**
     * Perform a rudimentary initialization of some Imperative utilities.
     * We must do this because VSCode apps do not typically call imperative.init.
     * @internal
     */
    public static initImpUtils(appName: string) {
        // create a rudimentary ImperativeConfig if it has not been initialized
        if (ImperativeConfig.instance.loadedConfig == null) {
            let homeDir: string = null;
            const envVarPrefix = appName.toUpperCase();
            const envVarNm = envVarPrefix + EnvironmentalVariableSettings.CLI_HOME_SUFFIX;
            if (process.env[envVarNm] === undefined) {
                // use OS home directory
                homeDir = pathJoin(osHomedir(), "." + appName.toLowerCase());
            } else {
                // use the available environment variable
                homeDir = pathNormalize(process.env[envVarNm]);
            }
            ImperativeConfig.instance.loadedConfig = {
                name: appName,
                defaultHome: homeDir,
                envVariablePrefix: envVarPrefix
            };
            ImperativeConfig.instance.rootCommandName = appName;
        }

        // initialize logging
        if (LoggerManager.instance.isLoggerInit === false) {
            const loggingConfig = LoggingConfigurer.configureLogger(
                ImperativeConfig.instance.cliHome, ImperativeConfig.instance.loadedConfig
            );
            Logger.initLogger(loggingConfig);
        }
        return Logger.getImperativeLogger();
    }

}
