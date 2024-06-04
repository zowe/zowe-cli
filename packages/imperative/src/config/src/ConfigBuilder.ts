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
import { IImperativeConfig } from "../../imperative";
import { Config } from "./Config";
import { IConfig } from "./doc/IConfig";
import { IConfigBuilderOpts } from "./doc/IConfigBuilderOpts";
import { ICommandProfileTypeConfiguration } from "../../cmd";
import { ConfigUtils } from "./ConfigUtils";

export class ConfigBuilder {
    /**
     * Build a new Config object from an Imperative CLI app configuration.
     * @param impConfig The Imperative CLI app configuration.
     * @param globalConfig Is the config to be a global config?
     * @param opts Options to control aspects of the builder.
     */
    public static async build(impConfig: IImperativeConfig, globalConfig: boolean, opts?: IConfigBuilderOpts): Promise<IConfig> {
        opts = opts || {};
        const builtConfig: IConfig = Config.empty();

        for (const profile of impConfig.profiles) {
            const defaultProfile = ConfigBuilder.buildDefaultProfile(profile, opts);

            // Name our profile differently in a global config vs a project config
            const profileName: string = ConfigUtils.formGlobOrProjProfileNm(profile.type, globalConfig);

            // Add the profile to config and set it as default
            lodash.set(builtConfig, `profiles.${profileName}`, defaultProfile);

            if (opts.populateProperties) {
                builtConfig.defaults[profile.type] = profileName;
            }
        }

        // Prompt for properties missing from base profile
        if (impConfig.baseProfile != null && opts.getValueBack != null) {
            const baseProfileNm: string = ConfigUtils.formGlobOrProjProfileNm(impConfig.baseProfile.type, globalConfig);
            for (const [k, v] of Object.entries(impConfig.baseProfile.schema.properties)) {
                if (v.includeInTemplate && v.optionDefinition?.defaultValue == null) {
                    const propValue = await opts.getValueBack(k, v);
                    if (propValue != null) {
                        lodash.set(builtConfig, `profiles.${baseProfileNm}.properties.${k}`, propValue);
                    }
                }
            }
        }

        return { ...builtConfig, autoStore: true };
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
            case "string": return "";
            case "number": return 0;
            case "object": return {};
            case "array": return [];
            case "boolean": return false;
            default: return null;
        }
    }
}
