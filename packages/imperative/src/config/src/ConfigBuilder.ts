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

import * as path from "path";
import * as lodash from "lodash";
import { ProfileIO, ProfilesConstants, ProfileUtils } from "../../profiles";
import { IImperativeConfig } from "../../imperative";
import { Config } from "./Config";
import { IConfig } from "./doc/IConfig";
import { IConfigBuilderOpts } from "./doc/IConfigBuilderOpts";
import { CredentialManagerFactory } from "../../security";
import { IConfigConvertResult } from "./doc/IConfigConvertResult";
import { ICommandProfileTypeConfiguration } from "../../cmd";

export class ConfigBuilder {
    /**
     * Build a new Config object from an Imperative CLI app configuration.
     * @param impConfig The Imperative CLI app configuration.
     * @param opts Options to control aspects of the builder.
     */
    public static async build(impConfig: IImperativeConfig, opts?: IConfigBuilderOpts): Promise<IConfig> {
        opts = opts || {};
        const config: IConfig = Config.empty();

        for (const profile of impConfig.profiles) {
            const defaultProfile = ConfigBuilder.buildDefaultProfile(profile, opts);

            // Add the profile to config and set it as default
            lodash.set(config, `profiles.${profile.type}`, defaultProfile);

            if (opts.populateProperties) {
                config.defaults[profile.type] = profile.type;
            }
        }

        // Prompt for properties missing from base profile
        if (impConfig.baseProfile != null && opts.getValueBack != null) {
            for (const [k, v] of Object.entries(impConfig.baseProfile.schema.properties)) {
                if (v.includeInTemplate && v.optionDefinition?.defaultValue == null) {
                    const propValue = await opts.getValueBack(k, v);
                    if (propValue != null) {
                        lodash.set(config, `profiles.${impConfig.baseProfile.type}.properties.${k}`, propValue);
                    }
                }
            }
        }

        return { ...config, autoStore: true };
    }

    public static buildDefaultProfile(profile: ICommandProfileTypeConfiguration, opts?: IConfigBuilderOpts): {
        type: string;
        properties: Record<string, any>;
        secure: string[]
    } {
        const properties: { [key: string]: any } = {};
        const secureProps: string[] = [];
        for (const [k, v] of Object.entries(profile.schema.properties)) {
            if (opts.populateProperties && v.includeInTemplate) {
                if (v.secure) {
                    secureProps.push(k);
                } else {
                    if (v.optionDefinition != null) {
                        // Use default value of ICommandOptionDefinition if present
                        properties[k] = v.optionDefinition.defaultValue;
                    }
                    if (properties[k] === undefined) {
                        // Fall back to an empty value
                        properties[k] = this.getDefaultValue(v.type);
                    }
                }
            }
        }

        return {
            type: profile.type,
            properties,
            secure: secureProps
        };
    }

    /**
     * Convert existing v1 profiles to a Config object and report any conversion failures.
     * @param profilesRootDir Root directory where v1 profiles are stored.
     * @returns Results object including new config and error details for profiles that failed to convert.
     */
    public static async convert(profilesRootDir: string): Promise<IConfigConvertResult> {
        const result: IConfigConvertResult = {
            config: Config.empty(),
            profilesConverted: {},
            profilesFailed: []
        };

        for (const profileType of ProfileIO.getAllProfileDirectories(profilesRootDir)) {
            const profileTypeDir = path.join(profilesRootDir, profileType);
            const profileNames = ProfileIO.getAllProfileNames(profileTypeDir, ".yaml", `${profileType}_meta`);
            if (profileNames.length === 0) {
                continue;
            }

            for (const profileName of profileNames) {
                try {
                    const profileFilePath = path.join(profileTypeDir, `${profileName}.yaml`);
                    const profileProps = ProfileIO.readProfileFile(profileFilePath, profileType);
                    const secureProps = [];

                    for (const [key, value] of Object.entries(profileProps)) {
                        if (value.toString().startsWith(ProfilesConstants.PROFILES_OPTION_SECURELY_STORED)) {
                            const secureValue = await CredentialManagerFactory.manager.load(
                                ProfileUtils.getProfilePropertyKey(profileType, profileName, key), true);
                            if (secureValue != null) {
                                profileProps[key] = JSON.parse(secureValue);
                                secureProps.push(key);
                            } else {
                                delete profileProps[key];
                            }
                        }
                    }

                    result.config.profiles[ProfileUtils.getProfileMapKey(profileType, profileName)] = {
                        type: profileType,
                        properties: profileProps,
                        secure: secureProps
                    };

                    result.profilesConverted[profileType] = [...(result.profilesConverted[profileType] || []), profileName];
                } catch (error) {
                    result.profilesFailed.push({ name: profileName, type: profileType, error });
                }
            }

            try {
                const metaFilePath = path.join(profileTypeDir, `${profileType}_meta.yaml`);
                const profileMetaFile = ProfileIO.readMetaFile(metaFilePath);
                if (profileMetaFile.defaultProfile != null) {
                    result.config.defaults[profileType] = ProfileUtils.getProfileMapKey(profileType, profileMetaFile.defaultProfile);
                }
            } catch (error) {
                result.profilesFailed.push({ type: profileType, error });
            }
        }

        // convert profile property names that have been changed for V2
        ConfigBuilder.convertPropNames(result);
        result.config.autoStore = true;
        return result;
    }

    /**
     * Convert a set of known property names that have been renamed for
     * V2 conformance to their new names.
     *
     * @param conversionResult The conversion result structure in which we shall
     *      rename obsolete property names to their V2-compliant names.
     */
    private static convertPropNames(conversionResult: IConfigConvertResult): void {
        const nameConversions = [
            ["hostname", "host"],
            ["username", "user"],
            ["pass", "password"]
        ];

        // interate through all of the recorded profiles
        for (const currProfNm of Object.keys(conversionResult.config.profiles)) {
            // iterate through the non-secure properties of the current profile
            const profPropsToConvert = [];
            const currProps = conversionResult.config.profiles[currProfNm].properties;
            for (const [currPropName, currPropVal] of Object.entries(currProps)) {
                // iterate through the set of names that we must convert
                for (const [oldPropName, newPropName] of nameConversions) {
                    if (currPropName === oldPropName) {
                        /* Store the property conversion info for later replacement.
                         * We do not want to add and delete properties while
                         * we are iterating the properties.
                         */
                        const propToConvert = [oldPropName, newPropName, currPropVal];
                        profPropsToConvert.push(propToConvert);

                        /* We recorded the replacement for this property name.
                         * No need to look for more name conversions on this name.
                         */
                        break;
                    }
                }
            } // end for all properties

            // convert the non-secure property names for the current profile
            for (const [oldPropName, newPropName, propValue] of profPropsToConvert) {
                delete currProps[oldPropName];
                currProps[newPropName] = propValue;
            }

            // iterate through the secure property names of the current profile
            const currSecProps = conversionResult.config.profiles[currProfNm].secure;
            for (let secInx = 0; secInx < currSecProps.length; secInx++) {
                // iterate through the set of names that we must convert
                for (const [oldPropName, newPropName] of nameConversions) {
                    if (currSecProps[secInx] === oldPropName) {
                        currSecProps[secInx] = newPropName;

                        /* We replaced this secure property name.
                         * No need to look for more name conversions on this name.
                         */
                        break;
                    }
                }
            }
        } // end for all profiles
    } // end convertPropNames

    /**
     * Returns empty value that is appropriate for the property type.
     * @param propType The type of profile property
     * @returns Null or empty object
     */
    private static getDefaultValue(propType: string | string[]): any {
        // TODO How to handle profile property with multiple types
        if (Array.isArray(propType)) {
            propType = propType[0];
        }
        switch (propType) {
            case "string":  return "";
            case "number":  return 0;
            case "object":  return {};
            case "array":   return [];
            case "boolean": return false;
            default:        return null;
        }
    }
}
