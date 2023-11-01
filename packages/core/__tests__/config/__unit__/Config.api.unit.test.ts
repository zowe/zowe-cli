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

import * as fs from "fs";
import * as path from "path";
import * as JSONC from "comment-json";
import { ConfigSecure } from "../src/api";
import { Config } from "../src/Config";
import { ConfigConstants } from "../src/ConfigConstants";
import { IConfig } from "../src/doc/IConfig";
import { IConfigLayer } from "../src/doc/IConfigLayer";
import { IConfigProfile } from "../src/doc/IConfigProfile";

const MY_APP = "my_app";

const mergeConfig: IConfig = {
    profiles: {
        fruit: {
            properties: {
                origin: "Costa Rica",
                shipDate: "2000-01-01"
            },
            profiles: {
                apple: {
                    type: "fruit",
                    properties: {
                        color: "green"
                    }
                },
                grape: {
                    type: "fruit",
                    properties: {
                        color: "red"
                    }
                }
            },
            secure: [
                "secret"
            ]
        }
    },
    defaults: {
        fruit: "fruit.grape"
    },
    plugins: [
        "@zowe/vegetable-for-imperative"
    ],
    autoStore: false
};

describe("Config API tests", () => {
    beforeEach(() => {
        jest.spyOn(Config, "search").mockReturnValue(__dirname + "/__resources__/project.config.user.json");
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValue(false);
        jest.spyOn(ConfigSecure.prototype, "load").mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe("profiles", () => {
        describe("set", () => {
            it("should set a first level profile", async () => {
                const config = await Config.load(MY_APP);
                const profilesApi = config.api.profiles;
                const fakeProfile: IConfigProfile = {
                    type: "fruit",
                    profiles: {},
                    properties: {
                        color: "green"
                    }
                };
                profilesApi.set("grape", fakeProfile);
                const profile = profilesApi.get("grape");
                expect(profile).toMatchSnapshot();
                expect(profile.color).toEqual("green");
            });
            it("should set a second level profile", async () => {
                const config = await Config.load(MY_APP);
                const profilesApi = config.api.profiles;
                const fakeProfile: IConfigProfile = {
                    type: "fruit",
                    profiles: {},
                    properties: {
                        color: "green"
                    }
                };
                profilesApi.set("fruit.grape", fakeProfile);
                const profile = profilesApi.get("fruit");
                const nestedProfile = profilesApi.get("fruit.grape");
                expect(profile).toMatchSnapshot();
                expect(nestedProfile).toMatchSnapshot();
                expect(nestedProfile.color).toEqual("green");
                expect(nestedProfile.origin).toEqual("California");
            });
            it("should set a second level profile to a first level profile that doesn't exist", async () => {
                const config = await Config.load(MY_APP);
                const profilesApi = config.api.profiles;
                const fakeProfile: IConfigProfile = {
                    type: "vegetable",
                    profiles: {},
                    properties: {
                        color: "brown"
                    }
                };
                profilesApi.set("vegetables.potato", fakeProfile);
                const profile = profilesApi.get("vegetables.potato");
                const nestedProfile = profilesApi.get("vegetables.potato");
                expect(profile).toMatchSnapshot();
                expect(nestedProfile).toMatchSnapshot();
                expect(nestedProfile.color).toEqual("brown");
            });
            it("should successfully set a profile missing properties", async () => {
                const config = await Config.load(MY_APP);
                const profilesApi = config.api.profiles;
                const fakeProfile: IConfigProfile = {
                    type: "fruit",
                    profiles: {},
                    properties: undefined
                };
                profilesApi.set("grape", fakeProfile);
                const profile = profilesApi.get("grape");
                expect(profile).toEqual({});
            });
        });
        describe("get", () => {
            it("should get a first level profile", async () => {
                const config = await Config.load(MY_APP);
                const profile = config.api.profiles.get("fruit");
                expect(profile).toMatchSnapshot();
                expect(profile.origin).toEqual("California");
            });
            it("should get a second level profile", async () => {
                const config = await Config.load(MY_APP);
                const profile = config.api.profiles.get("fruit.apple");
                expect(profile).toMatchSnapshot();
                expect(profile.color).toEqual("red");
                expect(profile.origin).toEqual("California");
            });
            it("should fail to get a profile that doesn't exist", async () => {
                const config = await Config.load(MY_APP);
                const profile = config.api.profiles.get("vegetable");
                expect(profile).toEqual(null);
            });
            it("should return empty object if optional profile doesn't exist", async () => {
                const config = await Config.load(MY_APP);
                const profile = config.api.profiles.get("vegetable", false);
                expect(profile).toEqual({});
            });
        });
        describe("exists", () => {
            it("should return first layer profile exists if it does", async () => {
                const config = await Config.load(MY_APP);
                const exists = config.api.profiles.exists("fruit");
                expect(exists).toEqual(true);
            });
            it("should return second layer profile exists if it does", async () => {
                const config = await Config.load(MY_APP);
                const exists = config.api.profiles.exists("fruit.apple");
                expect(exists).toEqual(true);
            });
            it("should return first layer profile does not exist", async () => {
                const config = await Config.load(MY_APP);
                const exists = config.api.profiles.exists("vegetable");
                expect(exists).toEqual(false);
            });
            it("should return second layer profile does not exist", async () => {
                const config = await Config.load(MY_APP);
                const exists = config.api.profiles.exists("vegetable.potato");
                expect(exists).toEqual(false);
            });
            it("should return second layer profile does not exist even if first layer does", async () => {
                const config = await Config.load(MY_APP);
                const exists = config.api.profiles.exists("fruit.mango");
                expect(exists).toEqual(false);
            });
        });
        describe("defaultSet", () => {
            it("should set the default profile", async () => {
                const config = await Config.load(MY_APP);
                config.api.profiles.defaultSet("fruit", "fruit");
                const defaultProfile = config.properties.defaults.fruit;
                expect(defaultProfile).toEqual("fruit");
            });
            it("should set the default profile to one that does not exist", async () => {
                const config = await Config.load(MY_APP);
                config.api.profiles.defaultSet("fruit", "vegetable");
                const defaultProfile = config.properties.defaults.fruit;
                expect(defaultProfile).toEqual("vegetable");
            });
        });
        describe("defaultGet", () => {
            it("should get the default profile", async () => {
                const config = await Config.load(MY_APP);
                const profile = config.api.profiles.defaultGet("fruit");
                const profileExpected: any = {
                    origin: "California",
                    color: "red"
                };
                expect(profile).toMatchSnapshot();
                expect(profile).toEqual(profileExpected);
            });
            it("should return null if there is no default profile", async () => {
                const config = await Config.load(MY_APP);
                const profile = config.api.profiles.defaultGet("vegetable");
                expect(profile).toBeNull();
            });
        });
        describe("expandPath", () => {
            it("should expand a short proeprty path", async () => {
                const config = await Config.load(MY_APP);
                const profilePath = "lpar1.zosmf";
                expect(config.api.profiles.expandPath(profilePath)).toEqual("profiles.lpar1.profiles.zosmf");
            });
            it("should expand a path with the keyword profiles", async () => {
                const config = await Config.load(MY_APP);
                const profilePath = "profiles.zosmf";
                expect(config.api.profiles.expandPath(profilePath)).toEqual("profiles.profiles.profiles.zosmf");
            });
        });
        describe("getProfileNameFromPath", () => {
            it("should shrink profile paths", async () => {
                const config = await Config.load(MY_APP);
                const propertyPath = "profiles.lpar1.profiles.zosmf.properties.host";
                expect(config.api.profiles.getProfileNameFromPath(propertyPath)).toEqual("lpar1.zosmf");
            });
            it("should shrink profile paths with the keyword profiles", async () => {
                const config = await Config.load(MY_APP);
                const propertyPath = "profiles.profiles.profiles.zosmf.properties.host";
                expect(config.api.profiles.getProfileNameFromPath(propertyPath)).toEqual("profiles.zosmf");
            });
        });
    });
    describe("plugins", () => {
        describe("get", () => {
            it("should get the plugins", async () => {
                const config = await Config.load(MY_APP);
                const plugins: string[] = config.api.plugins.get();
                const expectedPlugins: string[] = ["@zowe/fruit-for-imperative"];
                expect(plugins).toMatchSnapshot();
                expect(plugins).toEqual(expectedPlugins);
            });
        });
    });
    describe("layers", () => {
        describe("read", () => {
            it("should load properties into active layer from disk and secure vault", async () => {
                const config = await Config.load(MY_APP);
                const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
                const readFileSpy = jest.spyOn(fs, "readFileSync");
                const secureLoadSpy = jest.spyOn(config.api.secure, "loadCached");
                config.api.layers.read();
                expect(existsSpy).toHaveBeenCalledTimes(5); // Once for each config layer and one more time for read
                expect(readFileSpy).toHaveBeenCalledTimes(1);
                expect(secureLoadSpy).toHaveBeenCalledTimes(1);
            });
        });
        describe("write", () => {
            it("should save the active config layer", async () => {
                const config = await Config.load(MY_APP);
                const secureSaveSpy = jest.spyOn(config.api.secure, "cacheAndPrune");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
                config.api.layers.write();
                expect(secureSaveSpy).toHaveBeenCalledTimes(1);
                expect(writeFileSpy).toHaveBeenCalledTimes(1);
                expect(writeFileSpy.mock.calls[0][1]).toMatchSnapshot();
            });

            it("should save the active config layer with comments", async () => {
                jest.spyOn(Config, "search").mockReturnValueOnce(__dirname + "/__resources__/commented-project.config.user.json");
                const config = await Config.load(MY_APP);
                const secureSaveSpy = jest.spyOn(config.api.secure, "cacheAndPrune");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
                config.api.layers.write();
                expect(secureSaveSpy).toHaveBeenCalledTimes(1);
                expect(writeFileSpy).toHaveBeenCalledTimes(1);
                expect(writeFileSpy.mock.calls[0][1]).toMatchSnapshot();
                expect(writeFileSpy.mock.calls[0][1]).toContain("/* block-comment */");
                expect(writeFileSpy.mock.calls[0][1]).toContain("// line-comment");
            });
        });
        describe("activate", () => {
            const filePathProjectConfig = path.join(__dirname, "__resources__", "project.config.json");
            const filePathProjectUserConfig = path.join(__dirname, "__resources__", "project.config.user.json");
            const filePathAppConfig = path.join(__dirname, "__resources__", "my_app.config.json");
            const filePathAppUserConfig = path.join(__dirname, "__resources__", "my_app.config.user.json");
            beforeEach(() => {
                jest.restoreAllMocks();
                jest.spyOn(Config, "search").mockReturnValueOnce(filePathProjectUserConfig)
                    .mockReturnValueOnce(filePathProjectConfig);
                jest.spyOn(path, "join").mockReturnValueOnce(filePathAppUserConfig)
                    .mockReturnValueOnce(filePathAppUserConfig)
                    .mockReturnValueOnce(filePathAppConfig)
                    .mockReturnValueOnce(filePathAppConfig);
                jest.spyOn(ConfigSecure.prototype, "load").mockResolvedValue(undefined);
            });
            it("should activate the project configuration", async () => {
                const config = await Config.load(MY_APP);
                config.api.layers.activate(false, false);
                const properties = config.api.layers.get();
                const filePath = filePathProjectConfig;
                const fileContents = fs.readFileSync(filePath).toString();
                expect(properties.user).toBe(false);
                expect(properties.global).toBe(false);
                expect(properties.exists).toBe(true);
                expect(properties.path).toEqual(filePath);
                expect(properties.properties.defaults).toEqual(JSON.parse(fileContents).defaults);
                expect(properties.properties.plugins).toEqual(JSON.parse(fileContents).plugins);
                expect(properties.properties.profiles).toEqual(JSON.parse(fileContents).profiles);
            });
            it("should activate the project user configuration", async () => {
                const config = await Config.load(MY_APP);
                config.api.layers.activate(true, false);
                const properties = config.api.layers.get();
                const filePath = filePathProjectUserConfig;
                const fileContents = fs.readFileSync(filePath).toString();
                expect(properties.user).toBe(true);
                expect(properties.global).toBe(false);
                expect(properties.exists).toBe(true);
                expect(properties.path).toEqual(filePath);
                expect(properties.properties.defaults).toEqual(JSON.parse(fileContents).defaults);
                expect(properties.properties.plugins).toEqual(JSON.parse(fileContents).plugins);
                expect(properties.properties.profiles).toEqual(JSON.parse(fileContents).profiles);
            });
            it("should activate the global configuration", async () => {
                const config = await Config.load(MY_APP);
                config.api.layers.activate(false, true);
                const properties = config.api.layers.get();
                const filePath = filePathAppConfig;
                const fileContents = fs.readFileSync(filePath).toString();
                expect(properties.user).toBe(false);
                expect(properties.global).toBe(true);
                expect(properties.exists).toBe(true);
                expect(properties.path).toEqual(filePath);
                expect(properties.properties.defaults).toEqual(JSON.parse(fileContents).defaults);
                expect(properties.properties.plugins).toEqual(JSON.parse(fileContents).plugins);
                expect(properties.properties.profiles).toEqual(JSON.parse(fileContents).profiles);
            });
            it("should activate the global user configuration", async () => {
                const config = await Config.load(MY_APP);
                config.api.layers.activate(true, true);
                const properties = config.api.layers.get();
                const filePath = filePathAppUserConfig;
                const fileContents = fs.readFileSync(filePath).toString();
                expect(properties.user).toBe(true);
                expect(properties.global).toBe(true);
                expect(properties.exists).toBe(true);
                expect(properties.path).toEqual(filePath);
                expect(properties.properties.defaults).toEqual(JSON.parse(fileContents).defaults);
                expect(properties.properties.plugins).toEqual(JSON.parse(fileContents).plugins);
                expect(properties.properties.profiles).toEqual(JSON.parse(fileContents).profiles);
            });
            it("should activate empty configuration in directory where it doesn't exist", async () => {
                const config = await Config.load(MY_APP);
                jest.spyOn(path, "join").mockRestore();
                const readLayerSpy = jest.spyOn(config.api.layers, "read");
                config.api.layers.activate(false, false, __dirname);
                const properties = config.api.layers.get();
                expect(properties.user).toBe(false);
                expect(properties.global).toBe(false);
                expect(properties.exists).toBe(false);
                expect(properties.path).toEqual(path.join(__dirname, "project.config.json"));
                expect(properties.properties).toEqual({
                    profiles: {},
                    defaults: {}
                });
                expect(readLayerSpy).toHaveBeenCalled();
            });
            it("should activate configuration in current directory without reloading it", async () => {
                const config = await Config.load(MY_APP);
                jest.spyOn(path, "join").mockRestore();
                const readLayerSpy = jest.spyOn(config.api.layers, "read");
                config.api.layers.activate(false, false, path.join(__dirname, "__resources__"));
                const properties = config.api.layers.get();
                expect(properties.user).toBe(false);
                expect(properties.global).toBe(false);
                expect(readLayerSpy).not.toHaveBeenCalled();
            });
        });
        describe("exists", () => {
            const fakePath = path.join(__dirname, "FAKE_PROJECT");
            const filePathProjectUserConfig = path.join(__dirname, "__resources__", "project.config.user.json");
            const filePathProjectConfig = path.join(__dirname, "__resources__", "project.config.json");
            const filePathAppUserConfig = path.join(__dirname, "__resources__", "my_app.config.user.json");
            const filePathAppConfig = path.join(__dirname, "__resources__", "my_app.config.json");
            beforeEach(() => {
                jest.restoreAllMocks();
                jest.spyOn(Config, "search")
                    .mockReturnValueOnce(filePathProjectUserConfig)
                    .mockReturnValueOnce(filePathProjectConfig);
                jest.spyOn(path, "join")
                    .mockReturnValueOnce(filePathAppUserConfig)
                    .mockReturnValueOnce(filePathAppUserConfig)
                    .mockReturnValueOnce(filePathAppConfig)
                    .mockReturnValueOnce(filePathAppConfig);
                jest.spyOn(ConfigSecure.prototype, "load").mockResolvedValue(undefined);
            });

            const validateExists = (opts: any): boolean => {
                /*
                    Layer order:
                        User Project Configuration
                        Non-User Project Configuration
                        User Global Configuration
                        Non-User Global Configuration
                */
                opts.config.mLayers.forEach((tLayer: IConfigLayer, index: number) => {
                    tLayer.exists = opts.layer[index];
                });
                const mySpy = jest.spyOn(fs, "existsSync");
                if (typeof opts.checkUser === "undefined") {
                    if (opts.userConfigFound) mySpy.mockReturnValueOnce(true);
                    else mySpy.mockReturnValueOnce(false).mockReturnValueOnce(opts.projConfigFound);
                } else { // checkUser is defined
                    if (opts.checkUser) mySpy.mockReturnValueOnce(opts.userConfigFound);
                    else mySpy.mockReturnValueOnce(opts.projConfigFound);
                }

                if (opts.inDir) {
                    jest.spyOn(path, "dirname").mockReturnValueOnce(opts.inDir);
                }
                const layer = opts.config.api.layers.get();
                const found: boolean = opts.config.layerExists(opts.inDir ?? "fake", opts.checkUser);
                expect(opts.config.layerActive()).toEqual(layer);
                return found;
            };

            it("should not find a layer if none exist and no config files are found regardless if are looking for user configuration", async () => {
                const simulate: any = {
                    config: await Config.load(MY_APP),
                    layer: [false, false, false, false],
                    userConfigFound: false,
                    projConfigFound: false,
                };
                expect(validateExists({ ...simulate, checkUser: undefined })).toBe(false);
                expect(validateExists({ ...simulate, checkUser: true })).toBe(false);
                expect(validateExists({ ...simulate, checkUser: false })).toBe(false);
            });

            it("should find a layer if it matches what we are looking for: User Config Layer", async () => {
                const simulate: any = {
                    config: await Config.load(MY_APP),
                    layer: [true, false, false, false],
                    userConfigFound: true,
                    projConfigFound: false,
                    inDir: fakePath,
                };
                expect(validateExists({ ...simulate, checkUser: undefined })).toBe(true);
                expect(validateExists({ ...simulate, checkUser: true })).toBe(true);
                expect(validateExists({ ...simulate, checkUser: false })).toBe(false);
            });

            it("should find a layer if it matches what we are looking for: Proj Config Layer", async () => {
                const simulate: any = {
                    config: await Config.load(MY_APP),
                    layer: [false, true, false, false],
                    userConfigFound: false,
                    projConfigFound: true,
                    inDir: fakePath,
                };
                expect(validateExists({ ...simulate, checkUser: undefined })).toBe(true);
                expect(validateExists({ ...simulate, checkUser: true })).toBe(false);
                expect(validateExists({ ...simulate, checkUser: false })).toBe(true);
            });

            it("should find a layer if it matches what we are looking for: User Global Layer", async () => {
                const simulate: any = {
                    config: await Config.load(MY_APP),
                    layer: [false, false, true, false],
                    userConfigFound: true,
                    projConfigFound: false,
                    inDir: fakePath,
                };
                expect(validateExists({ ...simulate, checkUser: undefined })).toBe(true);
                expect(validateExists({ ...simulate, checkUser: true })).toBe(true);
                expect(validateExists({ ...simulate, checkUser: false })).toBe(false);
            });

            it("should find a layer if it matches what we are looking for: Proj Global Layer", async () => {
                const simulate: any = {
                    config: await Config.load(MY_APP),
                    layer: [false, false, false, true],
                    userConfigFound: false,
                    projConfigFound: true,
                    inDir: fakePath,
                };
                expect(validateExists({ ...simulate, checkUser: undefined })).toBe(true);
                expect(validateExists({ ...simulate, checkUser: true })).toBe(false);
                expect(validateExists({ ...simulate, checkUser: false })).toBe(true);
            });
        });
        describe("get", () => {
            it("should get the active layer", async () => {
                const config = await Config.load(MY_APP);
                const layer = config.api.layers.get();
                layer.path = path.basename(layer.path); // Everyone has a different path.
                expect(layer).toMatchSnapshot();
                expect(layer.properties).toEqual(config.properties);
            });
        });
        describe("set", () => {
            it("should set the current layer", async () => {
                const config = await Config.load(MY_APP);
                const cnfg: IConfig = {
                    $schema: "fake",
                    defaults: {},
                    profiles: {
                        vegetable: {
                            properties: {
                                origin: "California",
                                color: "brown"
                            }
                        }
                    }
                };
                config.api.layers.set(cnfg);
                const retrievedConfig = config.api.layers.get().properties;
                expect(retrievedConfig).toMatchSnapshot();
                expect(retrievedConfig).toEqual(cnfg);
            });

            it("should set the current layer when nothing is provided", async () => {
                const config = await Config.load(MY_APP);
                const cnfg: IConfig = {
                    $schema: undefined,
                    defaults: undefined,
                    plugins: undefined,
                    profiles: undefined
                };
                config.api.layers.set(cnfg);
                const retrievedConfig = config.api.layers.get().properties;
                expect(retrievedConfig).toMatchSnapshot();
                expect(retrievedConfig.defaults).toEqual({});
                expect(retrievedConfig.profiles).toEqual({});
            });
        });
        describe("merge", () => {
            it("should merge config layers with correct priority", async () => {
                const config = await Config.load(MY_APP);
                config.api.layers.merge(mergeConfig);
                const retrievedConfig = (config as any).layerActive().properties;
                expect(retrievedConfig).toMatchSnapshot();

                // Check that new config was added
                expect(retrievedConfig.plugins.length).toBe(2);
                expect(retrievedConfig.profiles.fruit.profiles.grape).toBeDefined();
                expect(retrievedConfig.profiles.fruit.properties.shipDate).toBeDefined();
                expect(retrievedConfig.profiles.fruit.secure.length).toBe(1);
                expect(retrievedConfig.autoStore).toBe(false);

                // Check that old config had priority
                expect(retrievedConfig.defaults.fruit).toBe("fruit.apple");
                expect(retrievedConfig.profiles.fruit.profiles.apple.properties.color).toBe("red");
                expect(retrievedConfig.profiles.fruit.profiles.orange).toBeDefined();
                expect(retrievedConfig.profiles.fruit.properties.origin).toBe("California");
            });
        });
        describe("merge - dry run", () => {
            it("should merge config layers with correct priority", async () => {
                const config = await Config.load(MY_APP);
                const existingConfig = JSONC.parse(JSONC.stringify(config.layerActive(), null, ConfigConstants.INDENT));
                const retrievedConfig = (config.api.layers.merge(mergeConfig, true) as IConfigLayer).properties;
                expect(retrievedConfig).toMatchSnapshot();

                // Check that new config was added
                expect(retrievedConfig.plugins.length).toBe(2);
                expect(retrievedConfig.profiles.fruit.profiles.grape).toBeDefined();
                expect(retrievedConfig.profiles.fruit.properties.shipDate).toBeDefined();
                expect(retrievedConfig.profiles.fruit.secure.length).toBe(1);
                expect(retrievedConfig.autoStore).toBe(false);

                // Check that old config had priority
                expect(retrievedConfig.defaults.fruit).toBe("fruit.apple");
                expect(retrievedConfig.profiles.fruit.profiles.apple.properties.color).toBe("red");
                expect(retrievedConfig.profiles.fruit.profiles.orange).toBeDefined();
                expect(retrievedConfig.profiles.fruit.properties.origin).toBe("California");

                // Check that the original was not modified
                expect(config.layerActive()).toEqual(existingConfig);
            });
        });
        describe("find", () => {
            const nutProfile: IConfigProfile = {
                type: "nut",
                properties: {}
            };
            let config: Config;

            beforeEach(async () => {
                config = await Config.load(MY_APP);
                (config as any).mLayers[0].properties = {
                    profiles: {
                        coconut: nutProfile
                    }
                };
                (config as any).mLayers[1].properties = {
                    profiles: {
                        ...(config as any).mLayers[0].properties.profiles,
                        hazelnut: nutProfile
                    }
                };
                (config as any).mLayers[2].properties = {
                    profiles: {
                        ...(config as any).mLayers[1].properties.profiles,
                        peanut: nutProfile
                    }
                };
                (config as any).mLayers[3].properties = {
                    profiles: {
                        ...(config as any).mLayers[2].properties.profiles,
                        walnut: nutProfile
                    }
                };
            });

            it("should choose project user layer", async () => {
                const { user, global } = config.api.layers.find("coconut");
                expect(user).toBe(true);
                expect(global).toBe(false);
            });

            it("should choose project layer", async () => {
                const { user, global } = config.api.layers.find("hazelnut");
                expect(user).toBe(false);
                expect(global).toBe(false);
            });

            it("should choose global user layer", async () => {
                const { user, global } = config.api.layers.find("peanut");
                expect(user).toBe(true);
                expect(global).toBe(true);
            });

            it("should choose global layer", async () => {
                const { user, global } = config.api.layers.find("walnut");
                expect(user).toBe(false);
                expect(global).toBe(true);
            });
        });
    });
});
