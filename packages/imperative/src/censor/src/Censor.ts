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

import * as lodash from "lodash";
import { Arguments } from "yargs";
import { ICommandProfileProperty } from "../../cmd/src/doc/profiles/definition/ICommandProfileProperty";
import { CliUtils } from "../../utilities/src/CliUtils";
import { ICensorOptions } from "./doc/ICensorOptions";
import { Config } from "../../config/src/Config";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";
import { ICommandProfileTypeConfiguration } from "../../cmd";
import { IProfileSchema, IProfileTypeConfiguration } from "../../profiles";

export class Censor {
    /*
    * NOTE(Kelosky): Ideally we might have a consolidated list for secure fields, but for now we'll just
    * make sure they're collocated within the same class.
    *
    * NOTE(Harn): This list should be kept in sync with the base profile secure definitions and MUST be in camel case.
    */
    private static readonly MAIN_CENSORED_OPTIONS = ["auth", "pw", "pass", "password", "passphrase", "credentials",
        "authentication", "basicAuth", "tv", "tokenValue", "certFilePassphrase"];

    private static readonly MAIN_SECURE_PROMPT_OPTIONS = ["user", "password", "tokenValue", "passphrase", "keyPassphrase"];

    // The censor response.
    public static readonly CENSOR_RESPONSE = "****";

    // A set of default censored options.
    public static get DEFAULT_CENSORED_OPTIONS(): string[] {
        const censoredList = new Set<string>();
        for (const option of this.MAIN_CENSORED_OPTIONS) {
            censoredList.add(option);
            censoredList.add(CliUtils.getOptionFormat(option).kebabCase);
        }
        return Array.from(censoredList);
    }

    // Return a customized list of secure prompt options
    public static get SECURE_PROMPT_OPTIONS(): string[] {
        const censoredList = new Set<string>();
        for (const option of this.MAIN_SECURE_PROMPT_OPTIONS) {
            censoredList.add(option);
            censoredList.add(CliUtils.getOptionFormat(option).kebabCase);
        }
        return Array.from(censoredList);
    }

    // Set a censored options list that can be set and retrieved for each command.
    private static censored_options: Set<string> = new Set(this.DEFAULT_CENSORED_OPTIONS);

    // Keep a cached config object if provided in another function
    private static mConfig: Config = null;

    // Return a customized list of censored options (or just the defaults if not set).
    public static get CENSORED_OPTIONS(): string[] {
        return Array.from(this.censored_options);
    }

    /**
     * Specifies whether a given property path (e.g. "profiles.lpar1.properties.host") is a special value or not.
     * Special value: Refers to any value defined as secure in the schema definition.
     *                These values should be already masked by the application (and/or plugin) developer.
     * @param prop Property path to determine if it is a special value
     * @returns True - if the given property is to be treated as a special value; False - otherwise
     */
    public static isSpecialValue(prop: string): boolean {
        let specialValues = this.SECURE_PROMPT_OPTIONS;
        const getPropertyNames = (prop: ICommandProfileProperty): string[] => {
            const ret: string[] = [];
            ret.push(prop.optionDefinition?.name);
            prop.optionDefinitions?.map(opDef => ret.push(opDef.name));
            return ret;
        };

        for (const profile of this.profileSchemas) {
            // eslint-disable-next-line unused-imports/no-unused-vars
            for (const [_, prop] of Object.entries(profile.schema.properties)) {
                if (prop.secure) specialValues = lodash.union(specialValues, getPropertyNames(prop));
            }
        }

        for (const v of specialValues) {
            if (prop.endsWith(`.${v}`)) return true;
        }
        return false;
    }

    /**
     * Add a censored option, including it's camelCase and kebabCase versions
     * @param {string} option - The option to censor
     */
    public static addCensoredOption(option: string) {
        this.censored_options.add(option);
        this.censored_options.add(CliUtils.getOptionFormat(option).camelCase);
        this.censored_options.add(CliUtils.getOptionFormat(option).kebabCase);
    }

    /**
     * Singleton implementation of an internal reference to the schema
     */
    private static mSchema: ICommandProfileTypeConfiguration[] = null;

    /**
     * Helper method to get an internal reference to the loaded profiles
     */
    public static get profileSchemas(): ICommandProfileTypeConfiguration[] {
        if (this.mSchema == null) this.mSchema = ImperativeConfig.instance.loadedConfig?.profiles ?? [];
        return this.mSchema;
    }

    /**
     * Helper method to set an internal reference to loaded profiles
     * @param _schemas - The schemas to pass in to set to the logger
     */
    public static setProfileSchemas(_schemas: IProfileTypeConfiguration[] | Map<string, IProfileSchema>) {
        if (this.mSchema == null) {
            this.mSchema = [];
        }
        if (_schemas instanceof Map) {
            _schemas.forEach((v: IProfileSchema) => {
                this.mSchema.push({ type: v.type, schema: v });
            });
        } else if (Array.isArray(_schemas)) {
            _schemas.forEach((v: IProfileTypeConfiguration) => {
                this.mSchema.push({ type: v.type, schema: v.schema });
            });
        }
    }

    /**
     * Generate and set the list of censored options.
     * Attempt to source the censored options from the schema, config, and/or command being executed.
     * @param {ICensorOptions} censorOpts - The objects to use to gather options that should be censored
     */
    public static setCensoredOptions(censorOpts?: ICensorOptions) {
        this.censored_options = new Set(this.DEFAULT_CENSORED_OPTIONS);

        if (censorOpts) {
            // Save off the config object
            this.mConfig = censorOpts.config;

            // If we have a ProfileTypeConfiguration (i.e. ImperativeConfig.instance.loadedConfig.profiles)
            if (censorOpts.profiles) {this.setProfileSchemas(censorOpts.profiles);}

            for (const profileType of this.profileSchemas ?? []) {
                for (const [propName, propValue] of Object.entries(profileType.schema.properties)) {
                    // Include the property itself
                    if (propValue.secure) {
                        this.addCensoredOption(propName);
                    }

                    // Include any known aliases (if available)
                    if ((propValue as ICommandProfileProperty).optionDefinition?.aliases != null) {
                        for (const alias of (propValue as ICommandProfileProperty).optionDefinition.aliases) {
                            this.addCensoredOption(alias);
                        }
                    }
                }
            }

            // Include any secure options from the config
            if (censorOpts.config) {
                // Try to use the command and inputs to find the profiles being loaded
                if (censorOpts.commandDefinition && censorOpts.commandArguments) {
                    const profiles = [];
                    for (const prof of censorOpts.commandDefinition.profile?.required || []) {
                        profiles.push(prof);
                    }
                    for (const prof of censorOpts.commandDefinition.profile?.optional || []) {
                        profiles.push(prof);
                    }

                    for (const prof of profiles) {
                        // If the profile exists, append all of the secure props to the censored list
                        const profName = censorOpts.commandArguments?.[`${prof}-profile`];
                        if (profName && censorOpts.config.api.profiles.get(profName)) {
                            censorOpts.config.api.secure.securePropsForProfile(profName).forEach(prop => this.addCensoredOption(prop));
                        }
                    }
                } else {
                    // We only have a configuration file, assume every property that is secured should be censored
                    censorOpts.config.api.secure.findSecure(censorOpts.config.mProperties.profiles, "profiles").forEach(
                        prop => this.addCensoredOption(prop.split(".").pop())
                    );
                }
            }
        }
    }

    /**
     * Copy and censor any sensitive CLI arguments before logging/printing
     * @param {string[]} args - The args list to censor
     * @returns {string[]}
     */
    public static censorCLIArgs(args: string[]): string[] {
        const newArgs: string[] = JSON.parse(JSON.stringify(args));
        const censoredValues = this.CENSORED_OPTIONS.map(CliUtils.getDashFormOfOption);
        for (const value of censoredValues) {
            if (args.indexOf(value) >= 0) {
                const valueIndex = args.indexOf(value);
                if (valueIndex < args.length - 1) {
                    newArgs[valueIndex + 1] = this.CENSOR_RESPONSE; // censor the argument after the option name
                }
            }
        }
        return newArgs;
    }

    /**
     * Copy and censor any sensitive CLI arguments before logging/printing
     * @param {string} data - the data to censor
     * @returns {string} - the censored data
     */
    public static censorRawData(data: string, category: string = ""): string {
        const config = this.mConfig ?? ImperativeConfig.instance?.config;

        // Return the data if not using config
        if (!config?.exists) return data;

        // Return the data if we are printing to the console and masking is disabled
        if (ImperativeConfig.instance?.envVariablePrefix) {
            const envMaskOutput = EnvironmentalVariableSettings.read(ImperativeConfig.instance.envVariablePrefix).maskOutput.value;
            // Hardcoding "console" instead of using Logger.DEFAULT_CONSOLE_NAME because of circular dependencies
            if ((category === "console" || category === "json") && envMaskOutput.toUpperCase() === "FALSE") return data;
        }

        let newData = data;

        const secureFields = config.api.secure.findSecure(config.mProperties.profiles, "profiles");
        for (const prop of secureFields) {
            const sec = lodash.get(config.mProperties, prop);
            if (sec && typeof sec !== "object" && !this.isSpecialValue(prop)) {
                newData = newData.replace(new RegExp(sec, "gi"), this.CENSOR_RESPONSE);
            }
        }
        return newData;
    }

    /**
     * Copy and censor a yargs argument object before logging
     * @param {yargs.Arguments} args - the args to censor
     * @returns {yargs.Arguments} - a censored copy of the arguments
     */
    public static censorYargsArguments(args: Arguments): Arguments {
        const newArgs: Arguments = JSON.parse(JSON.stringify(args));

        for (const optionName of Object.keys(newArgs)) {
            if (this.CENSORED_OPTIONS.indexOf(optionName) >= 0) {
                const valueToCensor = newArgs[optionName];
                newArgs[optionName] = this.CENSOR_RESPONSE;
                for (const checkAliasKey of Object.keys(newArgs)) {
                    if (newArgs[checkAliasKey] === valueToCensor) {
                        newArgs[checkAliasKey] = this.CENSOR_RESPONSE;
                    }
                }
            }
        }
        return newArgs;
    }
}