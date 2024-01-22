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

/**
 * Imperative-internal class to load configuration
 * You should not need to call this from your CLI.
 */
import { IImperativeConfig } from "./doc/IImperativeConfig";
import * as os from "os";
import { ImperativeError } from "../error";

export class ConfigurationLoader {

    /**
     *
     * @param {IImperativeConfig} providedConfig - the configuration provided through the "init"
     *                             Imperative API. Pass undefined if no config specified
     * @param packageJson - caller's full package.json contents as an object. Used if
     *                             providedConfig is undefined.
     * @param callerFileRequirer - function that, when provided a string,
     *                             returns the require()d contents of a file relative
     *                             to where the caller initialized from
     * @returns {IImperativeConfig}
     */
    public static load(providedConfig: IImperativeConfig, packageJson: any,
        callerFileRequirer: (file: string) => any): IImperativeConfig {

        let config: IImperativeConfig = providedConfig;
        // if the user has not specified a config,
        // check their package.json
        if (config == null) {
            config = packageJson.imperative;
        }
        // if the config is still not present, that means
        // it's not in the package.json either
        // if we have no config, that's an error.
        if (config == null) {
            throw new ImperativeError({
                msg: "Imperative requires configuration before " +
                "it can be used. No configuration was passed to init(), " +
                "and no configuration was present in package.json. Please " +
                "provide configuration. "
            });
        }

        // if the user has specified a configuration module,
        // override the config with the content of the module specified
        if (config.configurationModule != null) {
            try {
                const daemonMode = config.daemonMode;
                config = callerFileRequirer(config.configurationModule);
                if (daemonMode) {config.daemonMode = daemonMode;}
            } catch (e) {
                throw new ImperativeError({
                    msg:
                    "An error was encountered attempting to load " +
                    "the specified configuration module. " + e.message
                });
            }
        }

        if (config.name == null) {
            // if name was not explicitly specified, default to the name from package.json
            config.name = packageJson.name;
        }

        if (config.defaultHome == null) {
            config.defaultHome = "~/." + config.name;
        }
        // replace tilde with os.homedir() to allow specification
        config.defaultHome = config.defaultHome.replace("~", os.homedir());

        config.definitions = config.definitions || [];
        config.overrides = config.overrides || {};
        return config;
    }
}
