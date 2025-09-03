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
import { ICommandProfileTypeConfiguration } from "../../cmd/src/doc/profiles/definition/ICommandProfileTypeConfiguration";
import { IProfileSchema} from "../../profiles/src/doc/definition/IProfileSchema";
import { IProfileTypeConfiguration } from "../../profiles/src/doc/config/IProfileTypeConfiguration";

export class Censor {

    /*********************************************************************
    * Basic censorship items - list definitions & initialiazations, etc. *
    **********************************************************************/

    /*
    * NOTE(Kelosky): Ideally we might have a consolidated list for secure fields, but for now we'll just
    * make sure they're collocated within the same class.
    *
    * NOTE(Harn): This list should be kept in sync with the base profile secure definitions and MUST be in camel case.
    */
    private static readonly MAIN_CENSORED_OPTIONS = ["auth", "authentication", "basicAuth", "base64EncodedAuth", "certFilePassphrase", "credentials",
        "pw", "pass", "password", "passphrase", "tv", "tokenValue"];

    private static readonly MAIN_CENSORED_HEADERS = ["Authorization", "Cookie", "Proxy-Authorization"];

    private static readonly MAIN_SECURE_PROMPT_OPTIONS = ["keyPassphrase", "password", "passphrase", "tokenValue", "user"];

    // The censor response.
    public static readonly CENSOR_RESPONSE = "****";


    // The censor response.
    public static readonly NULL_SESS_OBJ_MSG = "Null session object was passed to API";

    // A set of default censored options.
    public static get DEFAULT_CENSORED_OPTIONS(): string[] {
        const censoredList = new Set<string>();
        for (const option of this.MAIN_CENSORED_OPTIONS) {
            censoredList.add(option);
            censoredList.add(CliUtils.getOptionFormat(option).kebabCase);
        }
        return Array.from(censoredList);
    }

    public static get DEFAULT_CENSORED_HEADERS(): string[] {
        const censoredList = new Set<string>();
        for (const option of this.MAIN_CENSORED_HEADERS) {
            censoredList.add(option);
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
    private static mCensoredOptions: Set<string> = new Set([...this.DEFAULT_CENSORED_OPTIONS, ...this.DEFAULT_CENSORED_HEADERS]);

    // Return a customized list of censored options (or just the defaults if not set).
    public static get CENSORED_OPTIONS(): string[] {
        return Array.from(this.mCensoredOptions);
    }

    //Singleton caches of the Config, Command Definition and Command Arguments
    private static mConfig: Config = null;

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
     * @param _schemas - The schmas to pass in to set to the logger
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

    /****************************************************
     * Helper functions for more advanced functionality *
     ****************************************************/

    /**
     * Helper function to handle profile schemas when setting the censored options
     * @param {IProfileTypeConfiguration | ICommandProfileTypeConfiguration} profileType - the profile type configuration to iterate over
     */
    private static handleSchema(profileType: IProfileTypeConfiguration | ICommandProfileTypeConfiguration): void {
        const secureOptions: Set<string> = new Set();

        /* eslint-disable-next-line no-unused-vars */
        for (const [key, cmdProp] of Object.entries(profileType.schema.properties)) {
            const prop = cmdProp as ICommandProfileProperty;
            // Add censored options from the schema if the option is secure
            if (prop.secure) {
                // Handle the case of a single option definition
                if (prop.optionDefinition) {
                    secureOptions.add(prop.optionDefinition.name);
                    for (const alias of prop.optionDefinition.aliases || []) {
                        // Remember to add the alias
                        secureOptions.add(alias);
                    }
                } else if (prop.optionDefinitions) {
                    // Handle the case of multiple option definitions
                    prop.optionDefinitions.forEach(opDef => {
                        secureOptions.add(opDef.name);
                        for (const alias of opDef.aliases || []) {
                            // Remember to add the alias
                            secureOptions.add(alias);
                        }
                    });
                } else {
                    secureOptions.add(key);
                }
            }
        }

        secureOptions.forEach(prop => this.addCensoredOption(prop));
    }

    /**
     * Add a censored option, including it's camelCase and kebabCase versions
     * @param {string} option - The option to censor
     */
    private static addCensoredOption(option: string) {
        // This option is required, but we do not want to ever allow null or undefined itself into the censored options
        if (option != null) {
            this.mCensoredOptions.add(option);
            this.mCensoredOptions.add(CliUtils.getOptionFormat(option).camelCase);
            this.mCensoredOptions.add(CliUtils.getOptionFormat(option).kebabCase);
        }
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
            for (const prop of Object.values(profile.schema.properties)) {
                if (prop.secure) specialValues = lodash.union(specialValues, getPropertyNames(prop));
            }
        }

        return specialValues.some((v) => prop.endsWith(`.${v}`));
    }

    /**
     * Identifies if a property is a secure property
     * @param {string} prop - The property to check
     * @returns {boolean} - True if the property is secure; False otherwise
     */
    public static isSecureValue(prop: string) {
        return this.CENSORED_OPTIONS.includes(prop);
    }

    /****************************************************************************************
     * Bread and butter functions, setting up the class and performing censorship of values *
     ****************************************************************************************/

    /**
     * Generate and set the list of censored options.
     * Attempt to source the censored options from the schema, config, and/or command being executed.
     * @param {ICensorOptions} censorOpts - The objects to use to gather options that should be censored
     */
    public static setCensoredOptions(censorOpts?: ICensorOptions) {
        this.mCensoredOptions = new Set([...this.DEFAULT_CENSORED_OPTIONS, ...this.DEFAULT_CENSORED_HEADERS]);

        if (censorOpts) {
            // Save off the config object
            this.mConfig = censorOpts.config;

            // If we have a ProfileTypeConfiguration (i.e. ImperativeConfig.instance.loadedConfig.profiles)
            if (censorOpts.profiles) { this.mSchema = []; this.setProfileSchemas(censorOpts.profiles); }

            for (const profileType of this.profileSchemas ?? []) {
                // If we know the command we are running, and we know the profile types that the command uses
                // we should only use those profiles to determine what should be censored. If we do not, we should
                // add everything
                if (censorOpts.commandDefinition == null ||
                    censorOpts.commandDefinition.profile?.optional?.includes(profileType.type) ||
                    censorOpts.commandDefinition.profile?.required?.includes(profileType.type)) {
                    this.handleSchema(profileType);
                }
            }

            // Include any secure options from the config
            if (censorOpts.config) {
                const secureOptions: Set<string> = new Set();

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
                        let profName = censorOpts.commandArguments?.[`${prof}-profile`];
                        if (!profName) { profName = this.mConfig.mProperties.defaults[`${prof}`]; }
                        if (profName && censorOpts.config.api.profiles.get(profName)) {
                            censorOpts.config.api.secure.securePropsForProfile(profName).forEach(prop => secureOptions.add(prop));
                        }
                    }
                } else {
                    // We only have a configuration file, assume every property that is secured should be censored
                    censorOpts.config.api.secure.findSecure(censorOpts.config.mProperties.profiles, "profiles").forEach(
                        prop => secureOptions.add(prop.split(".").pop())
                    );
                }
                secureOptions.forEach(prop => this.addCensoredOption(prop));
            }
        } else if (this.profileSchemas) {
            for (const profileType of this.profileSchemas) {
                this.handleSchema(profileType);
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
            const envShowSecureArgs = EnvironmentalVariableSettings.read(ImperativeConfig.instance.envVariablePrefix).showSecureArgs.value;
            // Hardcoding "console" instead of using Logger.DEFAULT_CONSOLE_NAME because of circular dependencies
            if ((category === "console" || category === "json") &&
                (envMaskOutput.toUpperCase() === "FALSE" || envShowSecureArgs.toUpperCase() === "TRUE")) {
                return data;
            }
        }

        let newData = data;

        const secureFields = config.api.secure.findSecure(config.mProperties.profiles, "profiles");
        for (const prop of secureFields) {
            const sec = lodash.get(config.mProperties, prop);
            if (sec && typeof sec !== "object" && !this.isSpecialValue(prop) && this.isSecureValue(prop.split(".").pop())) {
                newData = newData.replace(new RegExp(sec, "gi"), this.CENSOR_RESPONSE);
            }
        }
        return newData;
    }

    /**
     * Copy and censor any sensitive CLI arguments before logging/printing
     * @param {Record<string, any>} data - the data to censor
     * @returns {Record<string, any>} - the censored data
     */
    public static censorObject(data: Record<string, any>): Record<string, any> {
        const config = this.mConfig ?? ImperativeConfig.instance?.config;
        const secValues = [];

        if (config?.exists) {
            const secureFields = config.api.secure.findSecure(config.mProperties.profiles, "profiles");
            for (const prop of secureFields) {
                const sec = lodash.get(config.mProperties, prop);
                if (sec && typeof sec !== "object" && !this.isSpecialValue(prop) && this.isSecureValue(prop.split(".").pop())) {
                    secValues.push(sec);
                }
            }
        }

        // Do not modify the original data
        const dataCopy = this.mCensorObject(lodash.cloneDeep(data), secValues);
        return dataCopy;
    }

    /**
     * Copy and censor over an object
     * @param {Record<string, any>} data - the data to censor
     * @returns {Record<string, any>} - the censored data
     */
    private static mCensorObject(data: Record<string, any>, secureValues: any[]): Record<string, any> {
        const newData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (this.CENSORED_OPTIONS.includes(key) || secureValues.includes(value)) {
                newData[key] = this.CENSOR_RESPONSE;
            } else if (typeof value == "object") {
                newData[key] = this.mCensorObject(value, secureValues);
            } else {
                newData[key] = value;
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

    // ***********************************************************************
    /**
     * Censor sensitive data from an session object or a sub-object of a session.
     * The intent is to create a copy of the object that is suitable for logging.
     *
     * @param sessObj - A Session object (or ISession, or availableCreds) to be censored.
     *
     * @returns - The censored object as a string.
     */
    public static censorSession(sessObj: any): string {
        if (!sessObj) {
            return Censor.NULL_SESS_OBJ_MSG + " censorSession";
        }
        return Censor.replaceValsInSess(sessObj, true);
    }

    // ***********************************************************************
    /**
     * Recursively replace sensitive data in an session-related object
     * and any relevant sub-objects.
     *
     * @param sessObj - A Session object (or ISession, or the availableCreds) to be censored.
     *
     * @returns - The censored object as a string.
     */
    private static replaceValsInSess(sessObj: any, createCopy: boolean): string {
        if (!sessObj) {
            return Censor.NULL_SESS_OBJ_MSG + " replaceValsInSess";
        }

        const propsToBeCensored = [...Censor.SECURE_PROMPT_OPTIONS, ...Censor.DEFAULT_CENSORED_OPTIONS, ...Censor.DEFAULT_CENSORED_HEADERS];

        // create copy of sessObj so that we can replace values in a censored object
        let censoredSessObj;
        if (createCopy) {
            try {
                censoredSessObj = JSON.parse(JSON.stringify(sessObj));
            } catch(error) {
                return "Invalid session object was passed to API replaceValsInSess. Reason = " + error.toString();
            }
        } else {
            censoredSessObj = sessObj;
        }

        // Censor values in the top level of the supplied object
        for (const censoredProp of propsToBeCensored) {
            if (censoredSessObj[censoredProp] != null) {
                censoredSessObj[censoredProp] = Censor.CENSOR_RESPONSE;
            }
        }

        if (censoredSessObj.mISession) {
            // the object has an ISession sub-object, so censor those values
            Censor.replaceValsInSess(censoredSessObj.mISession, false);
        }

        if (censoredSessObj._authCache?.availableCreds) {
            // the object has an availableCreds sub-object, so censor those values
            Censor.replaceValsInSess(censoredSessObj._authCache.availableCreds, false);
        }
        return JSON.stringify(censoredSessObj, null, 2);
    }
}