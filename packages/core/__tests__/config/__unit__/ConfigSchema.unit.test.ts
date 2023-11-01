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

import { IProfileTypeConfiguration } from "../../profiles";
import { ConfigSchema } from "../src/ConfigSchema";
import { cloneDeep } from "lodash";
import { ICommandProfileTypeConfiguration, ImperativeConfig, Logger } from "../../../src";
import { Config, IConfig, IConfigLayer, IConfigUpdateSchemaHelperOptions } from "../../../src/config";
import * as path from "path";

describe("Config Schema", () => {
    const schema = ConfigSchema;
    const missingProfileTypeEntry = {
        if: {
            properties: { type: false }
        },
        then: {
            properties: {
                properties: { title: "Missing profile type" }
            }
        }
    };
    const testProfileConfiguration: IProfileTypeConfiguration[] = [
        {
            type: "zosmf",
            schema: {
                title: "zosmf",
                description: "A fake zosmf profile",
                type: "object",
                required: [],
                properties: {
                    host: {
                        type: "string",
                        secure: false
                    }
                }
            }
        },
        {
            type: "base",
            schema: {
                title: "base",
                description: "A fake base profile",
                type: "object",
                required: [],
                properties: {
                    port: {
                        type: "number",
                        secure: false
                    }
                }
            }
        }
    ];
    const testProfileConfigurationSecure: IProfileTypeConfiguration[] = [
        {
            type: "zosmf",
            schema: {
                title: "zosmf",
                description: "A fake zosmf profile",
                type: "object",
                required: [],
                properties: {
                    host: {
                        type: "string",
                        secure: true
                    }
                }
            }
        }
    ];
    const testProfileConfigurationOptionDefinition: ICommandProfileTypeConfiguration[] = [
        {
            type: "zosmf",
            schema: {
                title: "zosmf",
                description: "A fake zosmf profile",
                type: "object",
                required: [],
                properties: {
                    host: {
                        type: "string",
                        optionDefinition: {
                            name: "host",
                            aliases: ["h"],
                            description: "The fake host to connect to",
                            type: "string",
                            defaultValue: "fake",
                            allowableValues: {
                                values: ["fake", "real"]
                            }
                        }
                    }
                }
            }
        }
    ];

    it("should be able to successfully build with no profile type configuration", () => {
        const testConfig: IProfileTypeConfiguration[] = [];
        const returnedSchema = schema.buildSchema(testConfig);
        const expectedAllOf: any = [missingProfileTypeEntry];
        expect(returnedSchema).toMatchSnapshot();
        expect(returnedSchema.properties.profiles.patternProperties["^\\S*$"].allOf).toEqual(expectedAllOf);
    });

    it("should be able to successfully build with a single profile type configuration", () => {
        const testConfig: IProfileTypeConfiguration[] = cloneDeep(testProfileConfiguration);
        testConfig.pop();
        const returnedSchema = schema.buildSchema(testConfig);
        const expectedAllOf: any[] = [
            missingProfileTypeEntry,
            {
                if: {
                    properties: {
                        type: {
                            const: "zosmf"
                        }
                    }
                },
                then: {
                    properties: {
                        properties: {
                            description: "A fake zosmf profile",
                            properties: {
                                host: {
                                    type: "string"
                                },
                            },
                            required: [],
                            title: "zosmf",
                            type: "object"
                        }
                    }
                }
            }
        ];
        expect(returnedSchema).toMatchSnapshot();
        expect(returnedSchema.properties.profiles.patternProperties["^\\S*$"].allOf).toEqual(expectedAllOf);
    });

    it("should be able to successfully build with two profile type configurations", () => {
        const testConfig: IProfileTypeConfiguration[] = cloneDeep(testProfileConfiguration);
        const returnedSchema = schema.buildSchema(testConfig);
        const expectedAllOf: any[] = [
            missingProfileTypeEntry,
            {
                if: {
                    properties: {
                        type: {
                            const: "zosmf"
                        }
                    }
                },
                then: {
                    properties: {
                        properties: {
                            description: "A fake zosmf profile",
                            properties: {
                                host: {
                                    type: "string"
                                },
                            },
                            required: [],
                            title: "zosmf",
                            type: "object"
                        }
                    }
                }
            },
            {
                if: {
                    properties: {
                        type: {
                            const: "base"
                        }
                    }
                },
                then: {
                    properties: {
                        properties: {
                            description: "A fake base profile",
                            properties: {
                                port: {
                                    type: "number"
                                },
                            },
                            required: [],
                            title: "base",
                            type: "object"
                        }
                    }
                }
            }
        ];
        expect(returnedSchema).toMatchSnapshot();
        expect(returnedSchema.properties.profiles.patternProperties["^\\S*$"].allOf).toEqual(expectedAllOf);
    });

    it("should be able to successfully build with a secure single profile type configuration", () => {
        const testConfig: IProfileTypeConfiguration[] = cloneDeep(testProfileConfigurationSecure);
        const returnedSchema = schema.buildSchema(testConfig);
        const expectedAllOf: any[] = [
            missingProfileTypeEntry,
            {
                if: {
                    properties: {
                        type: {
                            const: "zosmf"
                        }
                    }
                },
                then: {
                    properties: {
                        properties: {
                            description: "A fake zosmf profile",
                            properties: {
                                host: {
                                    type: "string"
                                },
                            },
                            required: [],
                            title: "zosmf",
                            type: "object"
                        },
                        secure: {
                            items: {
                                enum: ["host"]
                            }
                        }
                    }
                }
            }
        ];
        expect(returnedSchema).toMatchSnapshot();
        expect(returnedSchema.properties.profiles.patternProperties["^\\S*$"].allOf).toEqual(expectedAllOf);
    });

    it("should be able to successfully build with a complex single profile type configuration", () => {
        const testConfig: IProfileTypeConfiguration[] = cloneDeep(testProfileConfigurationOptionDefinition);
        const returnedSchema = schema.buildSchema(testConfig);
        const expectedAllOf: any[] = [
            missingProfileTypeEntry,
            {
                if: {
                    properties: {
                        type: {
                            const: "zosmf"
                        }
                    }
                },
                then: {
                    properties: {
                        properties: {
                            description: "A fake zosmf profile",
                            properties: {
                                host: {
                                    type: "string",
                                    default: "fake",
                                    description: "The fake host to connect to",
                                    enum: ["fake", "real"]
                                },
                            },
                            required: [],
                            title: "zosmf",
                            type: "object"
                        }
                    }
                }
            }
        ];
        expect(returnedSchema).toMatchSnapshot();
        expect(returnedSchema.properties.profiles.patternProperties["^\\S*$"].allOf).toEqual(expectedAllOf);
    });

    it("should be able to regenerate profile schemas from a schema object", () => {
        const testConfig: IProfileTypeConfiguration[] = cloneDeep(testProfileConfiguration);
        const returnedSchema = schema.buildSchema(testConfig);
        const origSchemas = schema.loadSchema(returnedSchema);
        expect(origSchemas.length).toBe(2);
        expect(origSchemas[0].type).toBe(testConfig[0].type);
        expect(origSchemas[1].type).toBe(testConfig[1].type);
        // The comparison below needs to be done in this order since we only want to check the structure of the object
        expect(testConfig[0].schema).toMatchObject(origSchemas[0].schema);
        expect(testConfig[1].schema).toMatchObject(origSchemas[1].schema);
    });

    it("should be able to regenerate profile schemas with option definitions from a schema object", () => {
        const testConfig: IProfileTypeConfiguration[] = cloneDeep(testProfileConfigurationOptionDefinition);
        const returnedSchema = schema.buildSchema(testConfig);
        const origSchemas = schema.loadSchema(returnedSchema);
        expect(origSchemas.length).toBe(1);
        expect(origSchemas[0].type).toBe(testConfig[0].type);
        // The comparison below needs to be done in this order since we only want to check the structure of the object
        expect(testConfig[0].schema).toMatchObject(origSchemas[0].schema);
    });

    describe("Function: updateSchema", () => {
        const fakeUserPath = "/fake/path/user/fake.config.user.json";
        const fakeProjPath = "/fake/path/proj/fake.config.json";
        const fakeSchema: any = "this is a fake schema, how cool is that?";
        const fakeUpdatesPaths_active: any = { active: fakeSchema };
        const fakeUpdatesPaths_global: any = { global: fakeSchema };
        const fakeUpdatesPaths_active_1: any = { active_1: fakeSchema };
        const fakeUpdatesPaths_active_2: any = { active_2: fakeSchema };
        const fakeLayer: IConfigLayer = {
            exists: true,
            global: false,
            user: false,
            path: fakeProjPath,
            properties: null,
        };
        const spyConfigApiLayersActivate: any = jest.fn();
        const spyConfigLayerActive: any = jest.fn();
        const spyConfigSetSchema: any = jest.fn();
        const spyConfigGetSchemaInfo: any = jest.fn();
        const spyConfigLayersExists: any = jest.fn();
        const fakeInstance = {
            loadedConfig: {},
            config: {
                api: {
                    layers: {
                        get: jest.fn().mockReturnValue(fakeLayer),
                        activate: spyConfigApiLayersActivate,
                    },
                },
                layerActive: spyConfigLayerActive,
                setSchema: spyConfigSetSchema,
                getSchemaInfo: spyConfigGetSchemaInfo,
                layerExists: spyConfigLayersExists,
                findLayer: jest.fn().mockReturnValue(fakeLayer),
            },
        };
        const anyConfigSchema: any = ConfigSchema;
        const helperOptions: IConfigUpdateSchemaHelperOptions = {
            layer: fakeLayer,
            config: fakeInstance.config as any,
            updatedPaths: {},
            updateOptions: {
                depth: 0,
                layer: "active",
                schema: fakeSchema,
            },
        };
        const originalImperativeConfig = cloneDeep(ImperativeConfig.instance);

        beforeEach(() => {
            jest.spyOn(ConfigSchema, "buildSchema").mockReturnValue(fakeSchema);
            jest.spyOn(Logger, "getAppLogger").mockReturnValue({ debug: jest.fn() } as any);
            Object.defineProperty(ImperativeConfig, "instance", {
                get: () => fakeInstance
            });
        });
        afterEach(() => {
            jest.clearAllMocks();
            jest.restoreAllMocks();
        });
        afterAll(() => {
            Object.defineProperty(ImperativeConfig, "instance", {
                get: () => originalImperativeConfig
            });
        });

        it("should update the schema without any parameters", () => {
            const mySpy = jest.spyOn((ConfigSchema as any), "_updateSchemaActive").mockReturnValue(fakeUpdatesPaths_active);
            expect(ConfigSchema.updateSchema()).toEqual(fakeUpdatesPaths_active);
            expect(mySpy).toHaveBeenCalledWith({
                layer: fakeLayer,
                config: fakeInstance.config,
                updatedPaths: {},
                updateOptions: {
                    depth: 0,
                    layer: "active",
                    schema: fakeSchema,
                },
            }, true);
        });

        it("should update the schema with a given schema and layer", () => {
            const mySpy = jest.spyOn((ConfigSchema as any), "_updateSchemaGlobal").mockReturnValue(fakeUpdatesPaths_active);
            expect(ConfigSchema.updateSchema({ schema: fakeSchema, layer: "global" })).toEqual(fakeUpdatesPaths_active);
            expect(mySpy).toHaveBeenCalledWith({
                layer: fakeLayer,
                config: fakeInstance.config,
                updatedPaths: {},
                updateOptions: {
                    depth: 0,
                    layer: "global",
                    schema: fakeSchema,
                },
            });
        });

        it("should update the schema with a given schema, layer, and depth", () => {
            const mySpy = jest.spyOn((ConfigSchema as any), "_updateSchemaAll").mockReturnValue(fakeUpdatesPaths_active);
            expect(ConfigSchema.updateSchema({ schema: fakeSchema, layer: "all", depth: 100 })).toEqual(fakeUpdatesPaths_active);
            expect(mySpy).toHaveBeenCalledWith({
                layer: fakeLayer,
                config: fakeInstance.config,
                updatedPaths: {},
                updateOptions: {
                    depth: 100,
                    layer: "all",
                    schema: fakeSchema,
                },
            });
        });

        it("should throw an error if the layer is unknown", () => {
            const mySpy = jest.spyOn((ConfigSchema as any), "_updateSchemaAll").mockReturnValue(fakeUpdatesPaths_active);
            let caughtError = null;
            let result = null;
            try {
                result = ConfigSchema.updateSchema({ schema: fakeSchema, layer: "fake" } as any);
            } catch (err) {
                caughtError = err;
            }
            expect(result).toBe(null);
            expect(caughtError.message).toContain("Unrecognized layer parameter for ConfigSchema.updateSchemas");
            expect(mySpy).not.toHaveBeenCalled();
        });

        describe("Helper: _Active", () => {
            it("should update the schema for the project config when no user config is found", () => {
                spyConfigLayersExists.mockReturnValueOnce(true).mockReturnValue(false);
                spyConfigLayerActive.mockReturnValue(fakeLayer);
                spyConfigGetSchemaInfo.mockReturnValue({ original: fakeSchema, local: true });

                const expectedUpdatedPaths = {
                    [fakeLayer.path]: { schema: fakeSchema, updated: true },
                };
                expect(anyConfigSchema._updateSchemaActive(helperOptions)).toEqual(expectedUpdatedPaths);

                expect(spyConfigLayerActive).toHaveBeenCalled();
                expect(spyConfigSetSchema).toHaveBeenCalledWith(fakeSchema);
                expect(spyConfigGetSchemaInfo).toHaveBeenCalled();
                expect(spyConfigLayersExists).toHaveBeenCalledWith(path.dirname(fakeProjPath), !fakeLayer.user);
                expect(spyConfigApiLayersActivate).not.toHaveBeenCalled();

            });

            it("should update the schema for both, project and user config", () => {
                spyConfigLayersExists.mockReturnValue(true);
                spyConfigLayerActive
                    .mockReturnValueOnce({ ...fakeLayer, ...{ path: fakeUserPath } })
                    .mockReturnValueOnce({ ...fakeLayer, ...{ path: fakeProjPath } });
                spyConfigGetSchemaInfo
                    .mockReturnValueOnce({ original: fakeSchema, local: true })
                    .mockReturnValueOnce({ original: fakeSchema, local: false });

                const expectedUpdatedPaths = {
                    [fakeUserPath]: { schema: fakeSchema, updated: true },
                    [fakeProjPath]: { schema: fakeSchema, updated: false },
                };
                expect(anyConfigSchema._updateSchemaActive(helperOptions)).toEqual(expectedUpdatedPaths);

                // Total function calls
                expect(spyConfigLayerActive).toHaveBeenCalledTimes(2);
                expect(spyConfigSetSchema).toHaveBeenCalledTimes(2);
                expect(spyConfigGetSchemaInfo).toHaveBeenCalledTimes(2);
                expect(spyConfigLayersExists).toHaveBeenCalledTimes(4);
                expect(spyConfigApiLayersActivate).toHaveBeenCalledTimes(2);

                // Order of recursion
                // Before recursive call
                expect(spyConfigLayerActive).toHaveBeenCalled();
                expect(spyConfigSetSchema).toHaveBeenCalledWith(fakeSchema);
                expect(spyConfigGetSchemaInfo).toHaveBeenCalled();
                expect(spyConfigLayersExists).toHaveBeenCalledWith(path.dirname(fakeUserPath), !fakeLayer.user);
                expect(spyConfigApiLayersActivate).toHaveBeenCalledWith(!fakeLayer.user, fakeLayer.global, path.dirname(fakeUserPath));
                // Recursive call
                expect(spyConfigLayerActive).toHaveBeenCalled();
                expect(spyConfigSetSchema).toHaveBeenCalledWith(fakeSchema);
                expect(spyConfigGetSchemaInfo).toHaveBeenCalled();
                expect(spyConfigLayersExists).toHaveBeenCalledWith(path.dirname(fakeProjPath), !fakeLayer.user);
                // After recursive call
                expect(spyConfigApiLayersActivate).toHaveBeenCalledWith(fakeLayer.user, fakeLayer.global, path.dirname(fakeUserPath));
            });
        });

        describe("Helper: _Global", () => {
            it("should update the schema by relying on the _Active helper function", () => {
                const mySpy = jest.spyOn((ConfigSchema as any), "_updateSchemaActive").mockReturnValue(fakeUpdatesPaths_active);
                expect(anyConfigSchema._updateSchemaGlobal(helperOptions)).toEqual(fakeUpdatesPaths_active);
                expect(mySpy).toHaveBeenCalledWith(helperOptions);
                expect(spyConfigApiLayersActivate).toHaveBeenCalledTimes(2);
                expect(spyConfigApiLayersActivate).toHaveBeenCalledWith(true, true);
                expect(spyConfigApiLayersActivate).toHaveBeenCalledWith(fakeLayer.user, fakeLayer.global, path.dirname(fakeLayer.path));
            });
        });

        describe("Helper: _All", () => {
            it("should update only the global layer if no other layers were found in the directory structure", () => {
                jest.spyOn(Config, "search").mockReturnValue(null);
                const spyActive = jest.spyOn((ConfigSchema as any), "_updateSchemaActive").mockReturnValue(fakeUpdatesPaths_active);
                const spyGlobal = jest.spyOn((ConfigSchema as any), "_updateSchemaGlobal").mockReturnValue(fakeUpdatesPaths_global);
                const copyHelperOptions = cloneDeep(helperOptions);
                copyHelperOptions.layer.global = true;

                expect(anyConfigSchema._updateSchemaAll(copyHelperOptions)).toEqual(fakeUpdatesPaths_active);

                expect(spyConfigApiLayersActivate).toHaveBeenCalledWith(fakeLayer.user, true, path.dirname(fakeLayer.path));
                expect(spyActive).toHaveBeenCalledWith(copyHelperOptions);
                expect(spyGlobal).not.toHaveBeenCalled();
                expect(spyConfigApiLayersActivate).toHaveBeenCalledWith(fakeLayer.user, true, path.dirname(fakeLayer.path));
                expect(spyConfigApiLayersActivate).toHaveBeenCalledTimes(2);
            });

            it("should update the project and global schemas if nothing else was found in the directory structure", () => {
                jest.spyOn(Config, "search").mockReturnValue(null);
                const spyActive = jest.spyOn((ConfigSchema as any), "_updateSchemaActive").mockReturnValue(fakeUpdatesPaths_active);
                const spyGlobal = jest.spyOn((ConfigSchema as any), "_updateSchemaGlobal").mockReturnValue(fakeUpdatesPaths_global);

                expect(anyConfigSchema._updateSchemaAll(helperOptions)).toEqual({ ...fakeUpdatesPaths_active, ...fakeUpdatesPaths_global });

                expect(spyConfigApiLayersActivate).toHaveBeenCalledWith(fakeLayer.user, fakeLayer.global, path.dirname(fakeLayer.path));
                expect(spyActive).toHaveBeenCalledWith(helperOptions);
                expect(spyGlobal).toHaveBeenCalledWith(helperOptions);
                expect(spyConfigApiLayersActivate).toHaveBeenCalledWith(fakeLayer.user, fakeLayer.global, path.dirname(fakeLayer.path));
                expect(spyConfigApiLayersActivate).toHaveBeenCalledTimes(2);
            });

            it("should update all schemas found up the directory structure and down to the given depth", () => {
                jest.spyOn(Config, "search").mockReturnValueOnce(fakeUserPath).mockReturnValueOnce(null);
                const spyActive = jest.spyOn((ConfigSchema as any), "_updateSchemaActive")
                    .mockReturnValueOnce(fakeUpdatesPaths_active)
                    .mockReturnValueOnce(fakeUpdatesPaths_active_1)
                    .mockReturnValueOnce(fakeUpdatesPaths_active_2);
                const spyGlobal = jest.spyOn((ConfigSchema as any), "_updateSchemaGlobal").mockReturnValue(fakeUpdatesPaths_global);
                spyConfigLayersExists.mockReturnValue(true);
                spyConfigLayerActive.mockReturnValue({ ...fakeLayer, ...{ path: fakeUserPath } });
                jest.doMock("fast-glob", () => {
                    return { sync: jest.fn().mockReturnValue([fakeProjPath]) };
                });
                const copyHelperOptions = cloneDeep(helperOptions);
                copyHelperOptions.updateOptions.depth = 1;

                expect(anyConfigSchema._updateSchemaAll(copyHelperOptions)).toEqual({
                    ...fakeUpdatesPaths_active,
                    ...fakeUpdatesPaths_active_1,
                    ...fakeUpdatesPaths_global,
                    ...fakeUpdatesPaths_active_2,
                });

                expect(spyConfigApiLayersActivate).toHaveBeenNthCalledWith(1, true, false, path.dirname(fakeProjPath));
                expect(spyConfigApiLayersActivate).toHaveBeenNthCalledWith(2, true, false, path.dirname(fakeUserPath));
                expect(spyConfigApiLayersActivate).toHaveBeenNthCalledWith(3, false, false, path.dirname(fakeProjPath));
                expect(spyConfigApiLayersActivate).toHaveBeenNthCalledWith(4, false, false, path.dirname(fakeProjPath));
                expect(spyActive).toHaveBeenCalledWith(copyHelperOptions);
                expect(spyGlobal).toHaveBeenCalledWith(copyHelperOptions);
                expect(spyActive).toHaveBeenCalledTimes(3);
                expect(spyConfigApiLayersActivate).toHaveBeenCalledTimes(4);
            });
        });
    });

    describe("Function: findPropertyType", () => {
        const configProps: IConfig = {
            profiles: {
                banana: {
                    type: "fruit",
                    properties: {}
                }
            },
            defaults: {}
        };
        const profileSchemas = [
            {
                type: "fruit",
                schema: {
                    properties: {
                        color: { type: "string" }
                    }
                }
            }
        ];

        it("should find property type defined in ImperativeConfig profile schema", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValueOnce({
                loadedConfig: { profiles: profileSchemas }
            } as any);
            const propType = ConfigSchema.findPropertyType("profiles.banana.properties.color", configProps);
            expect(propType).toBe("string");
        });

        it("should find property type defined in schema JSON file", () => {
            const configSchema = ConfigSchema.buildSchema(profileSchemas as any);
            const propType = ConfigSchema.findPropertyType("profiles.banana.properties.color", configProps, configSchema);
            expect(propType).toBe("string");
        });

        it("should not return type if JSON path is not a property", () => {
            const configSchema = ConfigSchema.buildSchema(profileSchemas as any);
            const propType = ConfigSchema.findPropertyType("profiles.banana", configProps, configSchema);
            expect(propType).toBeUndefined();
        });

        it("should not return type if profile type is undefined", () => {
            const configPropsCopy = JSON.parse(JSON.stringify(configProps));
            delete configPropsCopy.profiles.banana.type;
            const configSchema = ConfigSchema.buildSchema(profileSchemas as any);
            const propType = ConfigSchema.findPropertyType("profiles.banana.properties.color", configPropsCopy, configSchema);
            expect(propType).toBeUndefined();
        });

        it("should not return type if profile schema is missing", () => {
            const configSchema = ConfigSchema.buildSchema([]);
            const propType = ConfigSchema.findPropertyType("profiles.banana.properties.color", configProps, configSchema);
            expect(propType).toBeUndefined();
        });

        it("should not return type if property is missing from profile schema", () => {
            const profileSchemasCopy = JSON.parse(JSON.stringify(profileSchemas));
            profileSchemasCopy[0].schema.properties = {};
            const configSchema = ConfigSchema.buildSchema(profileSchemasCopy);
            const propType = ConfigSchema.findPropertyType("profiles.banana.properties.color", configProps, configSchema);
            expect(propType).toBeUndefined();
        });
    });
});
