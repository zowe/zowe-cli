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

import { CredentialManagerFactory, IImperativeConfig } from "../../../";
import { Config, ConfigBuilder, IConfig } from "../../../";
import { ProfileIO } from "../../../src/profiles";
import * as config from "../../../__tests__/__integration__/imperative/src/imperative";
import * as lodash from "lodash";

const expectedConfigObject: IConfig = {
    autoStore: true,
    defaults: {},
    profiles: {
        secured: {
            properties: {},
            secure: [],
            type: "secured"
        }
    }
};

const getValueBack = () => Promise.resolve("fake value");

function buildProfileProperty(name: string, type: string | Array<string>, missingOptDef: boolean = false) {
    if (missingOptDef === true) {
        return {
            type,
            includeInTemplate: true,
            optionDefinition: null
        };
    } else {
        return {
            type,
            includeInTemplate: true,
            optionDefinition: {
                name,
                description: "The info the keep in the profile.",
                type,
                required: true,
            }
        };
    }
}

describe("Config Builder tests", () => {
    let configEmptySpy: any;
    let getDefaultValueSpy: any;
    let expectedConfig: any;
    let testConfig: any;

    beforeEach(() => {
        jest.clearAllMocks();
        configEmptySpy = jest.spyOn(Config, "empty");
        getDefaultValueSpy = jest.spyOn(ConfigBuilder as any, "getDefaultValue");
        expectedConfig = lodash.cloneDeep(expectedConfigObject);
        testConfig = lodash.cloneDeep(config as IImperativeConfig);
        testConfig.profiles[0].schema.properties.secret.includeInTemplate = true;
    });

    describe("build", () => {

        it("should build a config without populating properties", async () => {
            const builtConfig = await ConfigBuilder.build(testConfig);
            expect(configEmptySpy).toHaveBeenCalledTimes(1);
            expect(getDefaultValueSpy).toHaveBeenCalledTimes(0); // Not populating any properties
            expect(builtConfig).toEqual(expectedConfig);
        });

        it("should build a config and populate properties", async () => {
            const builtConfig = await ConfigBuilder.build(testConfig, {populateProperties: true});
            expectedConfig.profiles.secured.properties.info = "";
            expectedConfig.profiles.secured.secure.push("secret");
            expectedConfig.defaults = { secured: "secured" };
            expect(configEmptySpy).toHaveBeenCalledTimes(1);
            expect(getDefaultValueSpy).toHaveBeenCalledTimes(1); // Populating default value for info
            expect(builtConfig).toEqual(expectedConfig);
        });

        it("should build a config and populate properties, even option with missing option definition", async () => {
            testConfig.profiles[0].schema.properties.fakestr = buildProfileProperty("fakestr", "string", true);
            const builtConfig = await ConfigBuilder.build(testConfig, {populateProperties: true});
            expectedConfig.profiles.secured.properties.info = "";
            expectedConfig.profiles.secured.properties.fakestr = "";
            expectedConfig.profiles.secured.secure.push("secret");
            expectedConfig.defaults = { secured: "secured" };
            expect(configEmptySpy).toHaveBeenCalledTimes(1);
            expect(getDefaultValueSpy).toHaveBeenCalledTimes(2); // Populating default value for info, fakestr
            expect(builtConfig).toEqual(expectedConfig);
        });

        it("should build a config and populate many empty properties", async () => {
            testConfig.profiles[0].schema.properties.fakestr = buildProfileProperty("fakestr", "string");
            testConfig.profiles[0].schema.properties.fakenum = buildProfileProperty("fakenum", "number");
            testConfig.profiles[0].schema.properties.fakeobj = buildProfileProperty("fakeobj", "object");
            testConfig.profiles[0].schema.properties.fakearr = buildProfileProperty("fakearr", "array");
            testConfig.profiles[0].schema.properties.fakebool = buildProfileProperty("fakebool", "boolean");
            testConfig.profiles[0].schema.properties.fakedflt = buildProfileProperty("fakedflt", "IShouldntExist");

            const builtConfig = await ConfigBuilder.build(testConfig, {populateProperties: true});
            expectedConfig.profiles.secured.properties.info = "";
            expectedConfig.profiles.secured.properties.fakestr = "";
            expectedConfig.profiles.secured.properties.fakenum = 0;
            expectedConfig.profiles.secured.properties.fakeobj = {};
            expectedConfig.profiles.secured.properties.fakearr = [];
            expectedConfig.profiles.secured.properties.fakebool = false;
            expectedConfig.profiles.secured.properties.fakedflt = null;
            expectedConfig.profiles.secured.secure.push("secret");
            expectedConfig.defaults = { secured: "secured" };

            expect(configEmptySpy).toHaveBeenCalledTimes(1);
            expect(getDefaultValueSpy).toHaveBeenCalledTimes(7); // Populating default value for info, fakestr, fakenum, fakeobj, fakearr, fakebool
            expect(builtConfig).toEqual(expectedConfig);
        });

        it("should build a config and populate an empty property that can have multiple types", async () => {
            testConfig.profiles[0].schema.properties.fakestr = buildProfileProperty("fakestr", ["string", "number", "boolean"]);

            const builtConfig = await ConfigBuilder.build(testConfig, {populateProperties: true});
            expectedConfig.profiles.secured.properties.info = "";
            expectedConfig.profiles.secured.properties.fakestr = "";
            expectedConfig.profiles.secured.secure.push("secret");
            expectedConfig.defaults = { secured: "secured" };

            expect(configEmptySpy).toHaveBeenCalledTimes(1);
            expect(getDefaultValueSpy).toHaveBeenCalledTimes(2); // Populating default value for info, fakestr
            expect(builtConfig).toEqual(expectedConfig);
        });

        it("should build a config with a base profile", async () => {
            testConfig.baseProfile = {
                type: "base",
                schema: {
                    type: "object",
                    title: "Base Profile",
                    description: "Base profile that stores values shared by multiple service profiles",
                    properties: {host: buildProfileProperty("host", "string")}
                }
            };
            testConfig.profiles.push(testConfig.baseProfile);
            const builtConfig = await ConfigBuilder.build(testConfig, {populateProperties: true});
            expectedConfig.profiles = {
                secured: {
                    type: "secured",
                    properties: {
                        info: ""
                    },
                    secure: ["secret"]
                },
                base: {
                    type: "base",
                    properties: {
                        host: ""
                    },
                    secure: []
                }
            };
            expectedConfig.defaults = { base: "base", secured: "secured" };

            expect(configEmptySpy).toHaveBeenCalledTimes(1);
            expect(getDefaultValueSpy).toHaveBeenCalledTimes(2); // Populating default value for host and info
            expect(builtConfig).toEqual(expectedConfig);
        });

        it("should build a config with a base profile and prompt for missing property", async () => {
            testConfig.baseProfile = {
                type: "base",
                schema: {
                    type: "object",
                    title: "Base Profile",
                    description: "Base profile that stores values shared by multiple service profiles",
                    properties: {host: buildProfileProperty("host", "string")}
                }
            };
            testConfig.profiles.push(testConfig.baseProfile);
            const builtConfig = await ConfigBuilder.build(testConfig, {populateProperties: true, getValueBack});
            expectedConfig.profiles = {
                secured: {
                    type: "secured",
                    properties: {
                        info: ""
                    },
                    secure: ["secret"]
                },
                base: {
                    type: "base",
                    properties: {
                        host: "fake value",
                    },
                    secure: []
                }
            };
            expectedConfig.defaults = { base: "base", secured: "secured" };

            expect(configEmptySpy).toHaveBeenCalledTimes(1);
            expect(getDefaultValueSpy).toHaveBeenCalledTimes(2); // Populating default value for host and info
            expect(builtConfig).toEqual(expectedConfig);
        });

        it("should build a config with a base profile and prompt for missing secure property", async () => {
            testConfig.profiles.push(testConfig.baseProfile);
            expectedConfig.profiles = {
                secured: {
                    type: "secured",
                    properties: {
                        info: ""
                    },
                    secure: ["secret"]
                },
                base: {
                    type: "base",
                    properties: {
                        secret: "fake value"
                    },
                    secure: ["secret"]
                }
            };
            expectedConfig.defaults = { base: "base", secured: "secured" };
            let builtConfig;
            let caughtError;
            try {
                builtConfig = await ConfigBuilder.build(testConfig, {populateProperties: true, getValueBack});
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
            expect(configEmptySpy).toHaveBeenCalledTimes(1);
            expect(getDefaultValueSpy).toHaveBeenCalledTimes(1); // Populating default value for info
            expect(builtConfig).toEqual(expectedConfig);
        });
    });

    describe("convert", () => {
        const mockSecureLoad = jest.fn().mockReturnValue("\"area51\"");

        beforeAll(() => {
            jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue({
                load: mockSecureLoad
            } as any);
        });

        it("should successfully convert multiple v1 profiles to config object", async () => {
            jest.spyOn(ProfileIO, "getAllProfileDirectories").mockReturnValueOnce(["fruit", "nut"]);
            jest.spyOn(ProfileIO, "getAllProfileNames")
                .mockReturnValueOnce(["apple", "banana", "coconut"])
                .mockReturnValueOnce(["almond", "brazil", "cashew"]);
            jest.spyOn(ProfileIO, "readMetaFile")
                .mockReturnValueOnce({ defaultProfile: "apple" } as any)
                .mockReturnValueOnce({ defaultProfile: "brazil" } as any);
            jest.spyOn(ProfileIO, "readProfileFile")
                .mockReturnValueOnce({ color: "green", secret: "managed by A" })
                .mockReturnValueOnce({ color: "yellow", secret: "managed by B" })
                .mockReturnValueOnce({ color: "brown", secret: "managed by C" })
                .mockReturnValueOnce({ unitPrice: 1 })
                .mockReturnValueOnce({ unitPrice: 5 })
                .mockReturnValueOnce({ unitPrice: 2 });
            const convertResult = await ConfigBuilder.convert(__dirname);
            expect(convertResult.config).toMatchObject({
                profiles: {
                    fruit_apple: {
                        type: "fruit",
                        properties: { color: "green", secret: "area51" },
                        secure: ["secret"]
                    },
                    fruit_banana: {
                        type: "fruit",
                        properties: { color: "yellow", secret: "area51" },
                        secure: ["secret"]
                    },
                    fruit_coconut: {
                        type: "fruit",
                        properties: { color: "brown", secret: "area51" },
                        secure: ["secret"]
                    },
                    nut_almond: {
                        type: "nut",
                        properties: { unitPrice: 1 },
                        secure: []
                    },
                    nut_brazil: {
                        type: "nut",
                        properties: { unitPrice: 5 },
                        secure: []
                    },
                    nut_cashew: {
                        type: "nut",
                        properties: { unitPrice: 2 },
                        secure: []
                    }
                },
                defaults: {
                    fruit: "fruit_apple",
                    nut: "nut_brazil"
                },
                autoStore: true
            });
            expect(Object.keys(convertResult.profilesConverted).length).toBe(2);
            expect(convertResult.profilesFailed.length).toBe(0);
        });

        it("should fail to convert invalid v1 profiles to config object", async () => {
            mockSecureLoad.mockReturnValueOnce(null);
            const metaError = new Error("invalid meta file");
            const profileError = new Error("invalid profile file");
            jest.spyOn(ProfileIO, "getAllProfileDirectories").mockReturnValueOnce(["fruit", "nut"]);
            jest.spyOn(ProfileIO, "getAllProfileNames")
                .mockReturnValueOnce(["apple", "banana", "coconut"])
                .mockReturnValueOnce([]);
            jest.spyOn(ProfileIO, "readMetaFile").mockImplementationOnce(() => { throw metaError; });
            jest.spyOn(ProfileIO, "readProfileFile")
                .mockImplementationOnce(() => ({ color: "green", secret: "managed by A" }))
                .mockImplementationOnce(() => { throw profileError; })
                .mockImplementationOnce(() => ({ color: "brown", secret: "managed by C" }));
            const convertResult = await ConfigBuilder.convert(__dirname);
            expect(convertResult.config).toMatchObject({
                profiles: {
                    fruit_apple: {
                        type: "fruit",
                        properties: { color: "green" },
                        secure: []
                    },
                    fruit_coconut: {
                        type: "fruit",
                        properties: { color: "brown", secret: "area51" },
                        secure: ["secret"]
                    }
                },
                defaults: {},
                autoStore: true
            });
            expect(Object.keys(convertResult.profilesConverted).length).toBe(1);
            expect(convertResult.profilesFailed.length).toBe(2);
            expect(convertResult.profilesFailed[0]).toMatchObject({
                name: "banana",
                type: "fruit",
                error: profileError
            });
            expect(convertResult.profilesFailed[1]).toMatchObject({
                type: "fruit",
                error: metaError
            });
        });
    });

    it("should convert v1 property names to v2 names", async () => {
        jest.spyOn(ProfileIO, "getAllProfileDirectories").mockReturnValueOnce(["zosmf"]);
        jest.spyOn(ProfileIO, "getAllProfileNames")
            .mockReturnValueOnce(["LPAR1"]);
        jest.spyOn(ProfileIO, "readMetaFile")
            .mockReturnValueOnce({ defaultProfile: "LPAR1" } as any);
        jest.spyOn(ProfileIO, "readProfileFile")
            .mockReturnValueOnce({
                hostname: "should change to host",
                username: "should change to user",
                pass: "managed by A"
            });

        const convertResult = await ConfigBuilder.convert(__dirname);

        expect(convertResult.config).toMatchObject({
            profiles: {
                zosmf_LPAR1: {
                    type: "zosmf",
                    properties: {
                        host: "should change to host",
                        user: "should change to user",
                        password: "area51"
                    },
                    secure: ["password"]
                }
            },
            defaults: {
                zosmf: "zosmf_LPAR1"
            },
            autoStore: true
        });
        expect(Object.keys(convertResult.profilesConverted).length).toBe(1);
        expect(convertResult.profilesFailed.length).toBe(0);
    });
});
