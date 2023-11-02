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

import { IConfig } from "./doc/IConfig";
import { IConfigSchema, IConfigUpdateSchemaHelperOptions, IConfigUpdateSchemaOptions, IConfigUpdateSchemaPaths } from "./doc/IConfigSchema";
import { Config } from "./Config";
import { ImperativeError } from "../error/ImperativeError";
import { Logger } from "../logger/Logger";
import { IExplanationMap, TextUtils } from "../utils/TextUtils";
import { ImperativeConfig } from "../utils/ImperativeConfig";
import { ICommandProfileProperty } from "../cmd/doc/profiles/definition/ICommandProfileProperty";
import { IProfileProperty, IProfileSchema, IProfileTypeConfiguration } from "../profiles/doc";

export class ConfigSchema {
    /**
     * JSON schema URI stored in $schema property of the schema
     * @readonly
     * @memberof ConfigSchema
     */
    private static readonly JSON_SCHEMA = "https://json-schema.org/draft/2020-12/schema";

    /**
     * Version number stored in $version property of the schema
     * @readonly
     * @memberof ConfigSchema
     */
    private static readonly SCHEMA_VERSION = "1.0";

    /**
     * Pretty explanation of the schema objects
     * @readonly
     * @memberof ConfigSchema
     */
    private static readonly explainSchemaSummary: IExplanationMap = {
        $schema: "URL",
        $version: "Version",
        properties: {
            defaults: "Default Definitions",
            explainedParentKey: "Properties",
            ignoredKeys: null
        },
        explainedParentKey: "Schema",
        ignoredKeys: null
    };

    /**
     * Transform an Imperative profile schema to a JSON schema. Removes any
     * non-JSON-schema properties and translates anything useful.
     * @param schema The Imperative profile schema
     * @returns JSON schema for profile properties
     */
    private static generateSchema(schema: IProfileSchema): any {
        const properties: { [key: string]: any } = {};
        const secureProps: string[] = [];
        for (const [k, v] of Object.entries(schema.properties || {})) {
            properties[k] = { type: v.type };
            const cmdProp = v as ICommandProfileProperty;
            if (cmdProp.optionDefinition != null) {
                properties[k].description = cmdProp.optionDefinition.description;
                if (cmdProp.optionDefinition.defaultValue != null) {
                    properties[k].default = cmdProp.optionDefinition.defaultValue;
                }
                if (cmdProp.optionDefinition.allowableValues != null) {
                    properties[k].enum = cmdProp.optionDefinition.allowableValues.values;
                }
            }
            if (v.secure) {
                secureProps.push(k);
            }
        }

        const propertiesSchema: any = {
            type: schema.type,
            title: schema.title,
            description: schema.description,
            properties
        };
        if (schema.required) {
            propertiesSchema.required = schema.required;
        }

        const secureSchema: any = {
            items: { enum: secureProps }
        };

        if (secureProps.length > 0) {
            return { properties: propertiesSchema, secure: secureSchema };
        } else {
            return { properties: propertiesSchema };
        }
    }

    /**
     * Transform a JSON schema to an Imperative profile schema.
     * @param schema The JSON schema for profile properties
     * @returns Imperative profile schema
     */
    private static parseSchema(schema: any): IProfileSchema {
        const properties: { [key: string]: IProfileProperty } = {};
        for (const [k, v] of Object.entries((schema.properties.properties || {}) as { [key: string]: any })) {
            properties[k] = { type: v.type };
            // Backward compatibility for schema versions <0.4 (prefixItems -> items)
            if ((schema.secure?.items || schema.secure?.prefixItems)?.enum.includes(k)) {
                properties[k].secure = true;
            }
            if (v.description != null || v.default != null || v.enum != null) {
                (properties[k] as ICommandProfileProperty).optionDefinition = {
                    name: k,
                    type: v.type,
                    description: v.description,
                    defaultValue: v.default,
                    allowableValues: v.enum ? { values: v.enum } : undefined
                };
            }
        }

        return {
            title: schema.properties.title,
            description: schema.properties.description,
            type: schema.properties.type,
            properties,
            required: schema.properties.required
        };
    }

    /**
     * HELPER function for updating the active layer's schema files
     * This operation is divided in 2 steps:
     * 1. Update the schema file corresponding to the active layer
     * 2. Update the opposite (user/non-user) layer if it exists
     *
     * @param opts The various properties needed to accomplish a recursive UpdateSchema operation
     * @param forceSetSchema Indicates if we should force the creation of the schema file even if the config doesn't exist (e.g. config init)
     * @param checkContrastingLayer Indicates if we should check for the opposite (user/non-user) layer
     * @returns Object containing the updated schema paths
     */
    private static _updateSchemaActive(
        opts: IConfigUpdateSchemaHelperOptions,
        forceSetSchema: boolean = false,
        checkContrastingLayer: boolean = true): IConfigUpdateSchemaPaths {

        let updatedPaths: IConfigUpdateSchemaPaths = opts.updatedPaths;
        const layer = opts.config.layerActive();

        if (opts.config.layerExists(path.dirname(layer.path), layer.user) || forceSetSchema) {
            Logger.getAppLogger().debug(`Updating "${layer.path}" with: \n` +
                TextUtils.prettyJson(TextUtils.explainObject(opts.updateOptions.schema, ConfigSchema.explainSchemaSummary, false), null, false));
            opts.config.setSchema(opts.updateOptions.schema);

            // Get the schema information to gather a list of updated paths
            const schemaInfo = opts.config.getSchemaInfo();

            updatedPaths = { [layer.path]: { schema: schemaInfo.original, updated: schemaInfo.local } };
        }
        if (opts.config.layerExists(path.dirname(layer.path), !layer.user) && checkContrastingLayer) {
            opts.config.api.layers.activate(!layer.user, layer.global, path.dirname(layer.path));
            updatedPaths = { ...updatedPaths, ...this._updateSchemaActive(opts, forceSetSchema, false) };

            // Back to previous layer
            opts.config.api.layers.activate(layer.user, layer.global, path.dirname(layer.path));
        }
        return updatedPaths;
    }

    /**
     * HELPER function for updating global schema files
     * This operation is divided in 2 steps:
     * 1. Activate the global layer
     * 2. Call the Active helper
     *
     * @param opts The various properties needed to accomplish a recursive UpdateSchema operation
     * @returns Object containing the updated schema paths
     */
    private static _updateSchemaGlobal(opts: IConfigUpdateSchemaHelperOptions): IConfigUpdateSchemaPaths {
        let updatedPaths: IConfigUpdateSchemaPaths = opts.updatedPaths;

        // Activate the Global configuration before updating it
        opts.config.api.layers.activate(true, true);
        updatedPaths = { ...updatedPaths, ...this._updateSchemaActive(opts) };

        // Back to initial layer
        opts.config.api.layers.activate(opts.layer.user, opts.layer.global, path.dirname(opts.layer.path));

        return updatedPaths;
    }

    /**
     * HELPER function for recursively updating schema files
     * This operation is divided in 3 steps:
     * 1. Traverse UP the directory structure while updating the corresponding schema files
     * 2. Update both (User and Non-User) Global configuration's schema files
     * 3. Traverse DOWN the directory structure based on the depth specified
     *
     * @param opts The various properties needed to accomplish a recursive UpdateSchema operation
     * @returns Object containing the updated schema paths
     */
    private static _updateSchemaAll(opts: IConfigUpdateSchemaHelperOptions): IConfigUpdateSchemaPaths {
        let updatedPaths = opts.updatedPaths;
        // Loop through layers starting at the initial one
        let currentLayer = opts.layer;
        let nextSchemaLocation = opts.layer.path;

        //___________________________________________________________________________________
        // Traverse UP
        while (nextSchemaLocation != null) {
            opts.config.api.layers.activate(true, false, path.dirname(nextSchemaLocation));
            currentLayer = opts.config.api.layers.get();

            // Update the current layer
            updatedPaths = { ...updatedPaths, ...this._updateSchemaActive(opts) };

            // Move on to the next directory up the tree
            nextSchemaLocation = Config.search(opts.config.schemaName, { startDir: path.join(path.dirname(currentLayer.path), "..") });
        }

        //___________________________________________________________________________________
        // Update Global Layers
        if (!opts.layer.global) {
            // Do not update the global layer if that's where we started from
            updatedPaths = { ...updatedPaths, ...this._updateSchemaGlobal(opts) };
        }

        //___________________________________________________________________________________
        // Traverse DOWN
        if (opts.updateOptions.depth > 0) {
            // Look for <APP>.schema.json
            const fg = require("fast-glob");
            // The `cwd` does not participate in Fast-glob's depth calculation, hence the + 1
            const matches: string[] = fg.sync(`**/${opts.config.schemaName}`, { dot: true, onlyFiles: true, deep: opts.updateOptions.depth + 1 });

            const globalProjConfig = opts.config.findLayer(false, true);
            const globalUserConfig = opts.config.findLayer(true, true);

            // Loop through all matches of <APP>.schema.json
            matches.forEach(schemaLoc => {

                // Check if a layer/config exists in the directory where we found the <APP>.schema.json
                if (opts.config.layerExists(path.dirname(schemaLoc))) {

                    // Activate the layer before updating it
                    opts.config.api.layers.activate(false, false, path.dirname(schemaLoc));
                    const layer = opts.config.layerActive();

                    // NOTE: Configs are assumed to be always local (because of path.resolve(layer.path)),
                    //       if we want to support Config URLs here, we need to call the config import APIs
                    if (path.resolve(layer.path) !== globalProjConfig.path && path.resolve(layer.path) !== globalUserConfig.path) {
                        updatedPaths = { ...updatedPaths, ...this._updateSchemaActive(opts) };
                    }
                }
            });
        }

        // Back to initial layer
        opts.config.api.layers.activate(opts.layer.user, opts.layer.global, path.dirname(opts.layer.path));

        return updatedPaths;
    }

    /**
     * Dynamically builds the config schema for this CLI.
     * @param profiles The profiles supported by this CLI
     * @returns JSON schema for all supported profile types
     */
    public static buildSchema(profiles: IProfileTypeConfiguration[]): IConfigSchema {
        const andEntries: any[] = [];
        const defaultProperties: { [key: string]: any } = {};
        profiles.forEach((profile: { type: string, schema: IProfileSchema }) => {
            andEntries.push({
                if: {
                    properties: {
                        type: { const: profile.type }
                    }
                },
                then: {
                    properties: this.generateSchema(profile.schema)
                }
            });
            defaultProperties[profile.type] = {
                description: `Default ${profile.type} profile`,
                type: "string"
            };
        });
        return {
            $schema: ConfigSchema.JSON_SCHEMA,
            $version: ConfigSchema.SCHEMA_VERSION,
            type: "object",
            description: "Zowe configuration",
            properties: {
                profiles: {
                    type: "object",
                    description: "Mapping of profile names to profile configurations",
                    patternProperties: {
                        "^\\S*$": {
                            type: "object",
                            description: "Profile configuration object",
                            properties: {
                                type: {
                                    description: "Profile type",
                                    type: "string",
                                    enum: Object.keys(defaultProperties)
                                },
                                properties: {
                                    description: "Profile properties object",
                                    type: "object"
                                },
                                profiles: {
                                    description: "Optional subprofile configurations",
                                    type: "object",
                                    $ref: "#/properties/profiles"
                                },
                                secure: {
                                    description: "Secure property names",
                                    type: "array",
                                    items: { type: "string" },
                                    uniqueItems: true
                                }
                            },
                            allOf: [
                                {
                                    if: {
                                        properties: { type: false }
                                    },
                                    then: {
                                        properties: {
                                            properties: { title: "Missing profile type" }
                                        }
                                    }
                                },
                                ...andEntries
                            ]
                        }
                    }
                },
                defaults: {
                    type: "object",
                    description: "Mapping of profile types to default profile names",
                    properties: defaultProperties
                },
                autoStore: {
                    type: "boolean",
                    description: "If true, values you enter when prompted are stored for future use"
                },
                // plugins: {
                //     description: "CLI plug-in names to load from node_modules (experimental)",
                //     type: "array",
                //     items: { type: "string" },
                //     uniqueItems: true
                // }
            }
        };
    }

    /**
     * Loads Imperative profile schema objects from a schema JSON file.
     * @param schema The schema JSON for config
     */
    public static loadSchema(schema: IConfigSchema): IProfileTypeConfiguration[] {
        const patternName = Object.keys(schema.properties.profiles.patternProperties)[0];
        const profileSchemas: IProfileTypeConfiguration[] = [];
        for (const obj of schema.properties.profiles.patternProperties[patternName].allOf) {
            if (obj.if.properties.type) {
                profileSchemas.push({
                    type: obj.if.properties.type.const,
                    schema: this.parseSchema(obj.then.properties)
                });
            }
        }
        return profileSchemas;
    }

    /**
     * Updates Imperative Config Schema objects from a schema JSON file.
     * @param options        The options object
     * @param options.layer  The layer in which we should update the schema file(s). Defaults to the active layer.
     * @param options.schema The optional schema object to use. If not provided, we build the schema object based on loadedConfig.profiles
     * @returns List of updated paths with the new/loaded or given schema
     */
    public static updateSchema(options?: IConfigUpdateSchemaOptions): IConfigUpdateSchemaPaths {
        // Handle default values
        const opts: IConfigUpdateSchemaOptions = { layer: "active", depth: 0, ...(options ?? {}) };

        // Build schema from loaded config if needed
        opts.schema = opts.schema ?? ConfigSchema.buildSchema(ImperativeConfig.instance.loadedConfig.profiles);

        const config = ImperativeConfig.instance.config;
        const layer = config.api.layers.get();
        let updatedPaths: IConfigUpdateSchemaPaths = {};
        const _updateSchemaOptions: IConfigUpdateSchemaHelperOptions = { config, layer, updatedPaths, updateOptions: opts };

        // Operate based on the given layer
        switch (opts.layer) {
            case "active": {
                // Call the _updateSchemaActive helper function
                updatedPaths = { ...updatedPaths, ...this._updateSchemaActive(_updateSchemaOptions, typeof options === "undefined") };
                break;
            }
            case "global": {
                // Call the _updateSchemaGlobal helper function
                updatedPaths = { ...updatedPaths, ...this._updateSchemaGlobal(_updateSchemaOptions) };
                break;
            }
            case "all": {
                // Call the _updateSchemaAll helper function
                updatedPaths = { ...updatedPaths, ...this._updateSchemaAll(_updateSchemaOptions) };
                break;
            }
            default: {
                throw new ImperativeError({
                    msg: "Unrecognized layer parameter for ConfigSchema.updateSchemas"
                });
            }
        }
        return updatedPaths;
    }

    /**
     * Find the type of a property based on schema info.
     * @param path Path to JSON property in config JSON
     * @param config Team config properties
     * @param schema Config schema definition. Defaults to profile schemas defined in Imperative config.
     */
    public static findPropertyType(path: string, config: IConfig, schema?: IConfigSchema): string | undefined {
        if (!path.includes(".properties.")) {
            return;
        }

        const pathSegments = path.split(".");
        const propertyName = pathSegments.pop();
        const profilePath = pathSegments.slice(0, -1).join(".");
        const profileType: string = lodash.get(config, `${profilePath}.type`);
        if (profileType == null) {
            return;
        }

        const profileSchemas = schema ? this.loadSchema(schema) : ImperativeConfig.instance.loadedConfig.profiles;
        const profileSchema = profileSchemas.find(p => p.type === profileType)?.schema;
        if (profileSchema != null && profileSchema.properties[propertyName] != null) {
            // TODO How to handle profile property with multiple types
            const property = profileSchema.properties[propertyName];
            if (property != null) {
                const propertyType = profileSchema.properties[propertyName].type;
                return Array.isArray(propertyType) ? propertyType[0] : propertyType;
            }
        }
    }
}
