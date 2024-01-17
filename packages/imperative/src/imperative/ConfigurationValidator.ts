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

import { IImperativeConfig } from "./doc/IImperativeConfig";
import { TextUtils } from "../utilities";
import { ImperativeError } from "../error";
import { ICommandProfileProperty } from "../cmd/doc/profiles/definition/ICommandProfileProperty";

/**
 * Imperative-internal class to validate configuration
 * You should not need to call this from your CLI.
 */
export class ConfigurationValidator {

    /**
     * Validate a configuration object that has already been completely loaded from
     * the consumer of Imperative.
     * @throws errors if the configuration is not valid
     * @param {IImperativeConfig} config
     */
    public static validate(config: IImperativeConfig): void {
        const getMissingFieldError = (fieldName: string) => {
            return new ImperativeError({
                msg: "Your Imperative configuration was missing the following required field: "
                + fieldName + ". Please provide this field in order to use Imperative"
            });
        };
        if (config.productDisplayName == null) {
            throw getMissingFieldError("productDisplayName");
        }
        if (config.commandModuleGlobs == null && config.definitions == null) {
            throw new ImperativeError({
                msg: "Your Imperative configuration had neither \"definitions\"" +
                " nor \"commandModuleGlobs\". At least one of these fields is required so that the syntax for " +
                "your CLI can be defined."
            });
        }

        if (config.primaryTextColor == null) {
            config.primaryTextColor = "yellow";
        } else {
            // if the user specified a color, test to make sure it works
            ConfigurationValidator.verifyChalkColor(config, "primaryTextColor", "primary text highlighting");
        }
        if (config.secondaryTextColor == null) {
            config.secondaryTextColor = "blue";
        } else {
            // if the user specified a color, test to make sure it works
            ConfigurationValidator.verifyChalkColor(config, "secondaryTextColor", "secondary text highlighting");
        }
        if (config.allowConfigGroup == null) {
            // default allowConfigGroup to true
            config.allowConfigGroup = true;
        }
        if (config.allowPlugins == null) {
            // default allowPlugins to true
            config.allowPlugins = true;
        }

        // validate profile configurations
        if (config.profiles != null) {
            for (const profileConfig of config.profiles) {
                if (profileConfig.schema == null) {
                    throw new ImperativeError({
                        msg: "Your Imperative profile configuration of type \"" + profileConfig.type +
                        "\" has no schema. Please provide a schema for your profile so that it can be used to " +
                        "validate the structure and content of the user's profiles, as well as " +
                        "generate commands."
                    });
                } else {
                    for (const propertyName of Object.keys(profileConfig.schema.properties)) {

                        const property: ICommandProfileProperty = profileConfig.schema.properties[propertyName];
                        if (property.optionDefinitions?.length > 1 && profileConfig.createProfileFromArgumentsHandler == null) {
                            throw new ImperativeError({
                                msg: TextUtils.formatMessage(
                                    "Your Imperative profile configuration of type \"{{type}}\"" +
                                        " has the schema property \"{{property}}\", which has multiple " +
                                        "option definitions, but no handler for creating a profile from " +
                                        "command line arguments. Imperative will not be able to determine " +
                                        "how to map multiple command line arguments to a single profile property " +
                                        "unless you provide a custom handler.",
                                    {
                                        type: profileConfig.type,
                                        property: propertyName
                                    })
                            }
                            );
                        }
                    }
                }
            }
        }
    }

    /**
     * Private utility to validate a consumer's chalk color setting
     * @param config - the config object  from the consumer
     * @param {string} colorProperty - the property of the config object
     * @param {string} colorPropertyDescriptiveName - the display name of the color you're validating
     */
    private static verifyChalkColor(config: any, colorProperty: string, colorPropertyDescriptiveName: string) {
        config[colorProperty] = config[colorProperty].toLowerCase();
        try {
            const chalk = require("chalk");
            const highlighterFunction: any = chalk[config[colorProperty]];
            highlighterFunction("test");
            if (TextUtils.AVAILABLE_CHALK_COLORS.indexOf(config[colorProperty]) < 0) {
                throw new ImperativeError(
                    {
                        msg: "The value specified was not one of the basic colors " +
                        "available through the chalk package."
                    });
            }
        } catch (e) {
            e.message = "The value you specified for the " + colorPropertyDescriptiveName + " color (\"" + config[colorProperty] + "\") " +
                "could not be successfully verified. The following error was caused while attempting to test the color: " + e.message;
            throw e;
        }
    }
}
