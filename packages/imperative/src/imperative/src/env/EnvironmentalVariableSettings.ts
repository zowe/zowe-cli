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

import { IImperativeEnvironmentalVariableSettings } from "../doc/IImperativeEnvironmentalVariableSettings";
import { ImperativeExpect } from "../../../expect";

/**
 * Service for reading environmental variable settings
 * exposed for CLIs built on Imperative CLI framework
 * @export
 * @class EnvironmentalVariableSettings
 */
export class EnvironmentalVariableSettings {

    /**
     * The end of the environmental variable for configuring the log level for the imperative logger of your CLI
     * The prefix will be added to the beginning of this value to construct the full key
     * @type {string}
     * @memberof EnvironmentalVariableSettings
     */
    public static readonly IMPERATIVE_LOG_LEVEL_KEY_SUFFIX = "_IMPERATIVE_LOG_LEVEL";

    /**
     * The end of the environmental variable for configuring the log level for the appLogger of your CLI
     * The prefix will be added to the beginning of this value to construct the full key
     * @type {string}
     * @memberof EnvironmentalVariableSettings
     */
    public static readonly APP_LOG_LEVEL_KEY_SUFFIX = "_APP_LOG_LEVEL";


    /**
     * The end of the environmental variable for configuring the home directory for your CLI
     * The prefix will be added to the beginning of this value to construct the full key
     * @type {string}
     * @memberof EnvironmentalVariableSettings
     */
    public static readonly CLI_HOME_SUFFIX = "_CLI_HOME";

    /**
     * The end of the environmental variable for configuring the prompt phrase for your CLI
     * The prefix will be added to the beginning of this value to construct the full key
     * @type {string}
     * @memberof EnvironmentalVariableSettings
     */
    public static readonly PROMPT_PHRASE_SUFFIX = "_PROMPT_PHRASE";


    /**
     * Read all environmental variable settings for a CLI
     * @param {string} prefix - the environmental variables for a CLI will begin with this prefix e.g. "SAMPLE_CLI".
     *                          by default, this should be the same as the Imperative.loadedConfig.name field
     *                          unless you specify envVariablePrefix on your Imperative configuration
     * @returns {IImperativeEnvironmentalVariableSettings} - object populated with the settings specified by the user
     * @memberof EnvironmentalVariableSettings
     */
    public static read(prefix: string): IImperativeEnvironmentalVariableSettings {
        ImperativeExpect.toBeDefinedAndNonBlank(prefix, "prefix", "You must specify the environmental variable prefix.");

        // helper to create an object matching IImperativeEnvironmentalVariableSetting from a key
        const getSetting = (key: string) => {
            return {key, value: process.env[key]};
        };
        return {
            imperativeLogLevel:
                getSetting(prefix + this.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX),
            appLogLevel:
                getSetting(prefix + this.APP_LOG_LEVEL_KEY_SUFFIX),
            cliHome:
                getSetting(prefix + this.CLI_HOME_SUFFIX),
            promptPhrase:
                getSetting(prefix + this.PROMPT_PHRASE_SUFFIX)
        };
    }
}
