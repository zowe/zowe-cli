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

// Mock out config APIs
jest.mock("../../config/src/Config");

import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";
import { Censor } from "../src/Censor";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { ICensorOptions } from "../..";

beforeAll(() => {
    (Censor as any).mSchema = null;
    Censor.setCensoredOptions();
});

afterAll(() => {
    jest.restoreAllMocks();
    (Censor as any).mSchema = null;
    Censor.setCensoredOptions();
});

describe("Censor tests", () => {
    const nonCensoredOptionsList = ["certFile", "cert-file", "certKeyFile", "cert-key-file", "h", "host", "p", "port", "notSecret", "u", "user"];

    it("should not change the default main censored options", () => {
        expect(Censor.CENSORED_OPTIONS).toEqual(Censor.DEFAULT_CENSORED_OPTIONS);
        expect(Censor.CENSORED_OPTIONS).toMatchSnapshot();
    });

    it("should not change the default secure prompt options", () => {
        expect(Censor.SECURE_PROMPT_OPTIONS).toMatchSnapshot();
    });

    it("should not change the censor response", () => {
        expect(Censor.CENSOR_RESPONSE).toMatchSnapshot();
    });

    describe("addCensoredOption", () => {
        beforeEach(() => {
            Censor.setCensoredOptions();
        });

        afterAll(() => {
            Censor.setCensoredOptions();
        });

        it("should add a censored option", () => {
            (Censor as any).addCensoredOption("secret");
            expect(Censor.CENSORED_OPTIONS).toContain("secret");
        });

        it("should add a censored option in kebab and camel case 1", () => {
            (Censor as any).addCensoredOption("secret-value");
            expect(Censor.CENSORED_OPTIONS).toContain("secret-value");
            expect(Censor.CENSORED_OPTIONS).toContain("secretValue");
        });

        it("should add a censored option in kebab and camel case 2", () => {
            (Censor as any).addCensoredOption("secretValue");
            expect(Censor.CENSORED_OPTIONS).toContain("secret-value");
            expect(Censor.CENSORED_OPTIONS).toContain("secretValue");
        });
    });

    describe("censorCLIArgs", () => {
        for (const opt of Censor.CENSORED_OPTIONS) {
            it(`should hide --${opt} operand`, () => {
                const data = Censor.censorCLIArgs([`--${opt}`, "cantSeeMe"]);
                expect(data).toContain(Censor.CENSOR_RESPONSE);
            });
        }

        for (const opt of nonCensoredOptionsList) {
            it(`should not hide --${opt} operand`, () => {
                const data = Censor.censorCLIArgs([`--${opt}`, "canSeeMe"]);
                expect(data).not.toContain(Censor.CENSOR_RESPONSE);
            });
        }
    });

    describe("censorRawData", () => {
        const secrets = ["secret0", "secret1"];
        let impConfigSpy: jest.SpyInstance = null;
        let envSettingsReadSpy: jest.SpyInstance = null;
        let findSecure: jest.SpyInstance = null;
        let impConfig: any = null; // tried Partial<ImperativeConfig> but some properties complain about missing functionality
        beforeEach(() => {
            jest.restoreAllMocks();
            findSecure = jest.fn();
            impConfigSpy = jest.spyOn(ImperativeConfig, "instance", "get");
            envSettingsReadSpy = jest.spyOn(EnvironmentalVariableSettings, "read");
            impConfig = {
                config: {
                    exists: true,
                    api: {
                        secure: { findSecure }
                    },
                    mProperties: {}
                }
            };
            Censor.setProfileSchemas(new Map());
        });

        afterAll(() => {
            impConfigSpy.mockRestore();
            envSettingsReadSpy.mockRestore();
        });

        describe("should NOT censor", () => {
            it("data if we are using old profiles 1", () => {
                impConfigSpy.mockReturnValue({ config: { exists: false }, envVariablePrefix: "ZOWE" });
                expect(Censor.censorRawData(secrets[0])).toEqual(secrets[0]);
            });

            it("data if we are using old profiles 2", () => {
                impConfigSpy.mockReturnValue({ config: undefined, envVariablePrefix: "ZOWE" });
                expect(Censor.censorRawData(secrets[0])).toEqual(secrets[0]);
            });

            it("Console Output if the MASK_OUTPUT env var is FALSE and category is console", () => {
                impConfigSpy.mockReturnValue({
                    config: { exists: true, api: { secure: { findSecure }}, mProperties: { profiles: []}},
                    envVariablePrefix: "ZOWE"
                });
                findSecure.mockReturnValue([]);
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" } });
                expect(Censor.censorRawData(secrets[1], "console")).toEqual(secrets[1]);
            });

            it("Console Output if the MASK_OUTPUT env var is FALSE and category is json", () => {
                impConfigSpy.mockReturnValue({
                    config: { exists: true, api: { secure: { findSecure }}, mProperties: { profiles: []}},
                    envVariablePrefix: "ZOWE"
                });
                findSecure.mockReturnValue([]);
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" } });
                expect(Censor.censorRawData(secrets[1], "json")).toEqual(secrets[1]);
            });

            describe("special value:", () => {
                beforeEach(() => {
                    impConfig.config.mProperties = {profiles: {secret: { properties: {}}}};
                    impConfigSpy.mockReturnValue(impConfig);
                    envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "TRUE" } });
                });

                const _lazyTest = (prop: string): [string, string] => {
                    findSecure.mockReturnValue([`profiles.secret.properties.${prop}`, "profiles.secret.properties.secret"]);
                    impConfig.config.mProperties.profiles.secret.properties = {[prop]: secrets[0], secret: secrets[1] };

                    const received = Censor.censorRawData(`visible secret: ${secrets[0]}, masked secret: ${secrets[1]}`);
                    const expected = `visible secret: ${secrets[0]}, masked secret: ${Censor.CENSOR_RESPONSE}`;
                    return [received, expected];
                };

                for (const opt of Censor.SECURE_PROMPT_OPTIONS) {
                    it(`${opt}`, () => {
                        const [received, expected] = _lazyTest(opt);
                        expect(received).toEqual(expected);
                    });
                }
            });
        });

        describe("should censor", () => {
            beforeEach(() => {
                impConfig.config.mProperties = {profiles: {secret: { properties: {}}}};
                impConfigSpy.mockReturnValue(impConfig);
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" } });
            });

            afterAll(() => {
                (Censor as any).mConfig = null;
            });

            it("data if the logger category is not console, regardless of the MASK_OUTPUT env var value 1", () => {
                findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
                impConfig.config.mProperties.profiles.secret.properties = {secret: secrets[1] };
                const received = Censor.censorRawData(`masked secret: ${secrets[1]}`, "This is not the console");
                const expected = `masked secret: ${Censor.CENSOR_RESPONSE}`;
                expect(received).toEqual(expected);
            });

            it("data if the logger category is not console, regardless of the MASK_OUTPUT env var value 2", () => {
                (Censor as any).mConfig = {
                    exists: true,
                    mProperties: {
                        profiles: {
                            secret: {
                                properties: {
                                    secret: secrets[1]
                                }
                            }
                        }
                    },
                    api: {
                        secure: {
                            findSecure
                        }
                    }
                };
                findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
                const received = Censor.censorRawData(`masked secret: ${secrets[1]}`, "This is not the console");
                const expected = `masked secret: ${Censor.CENSOR_RESPONSE}`;
                expect(received).toEqual(expected);
            });
        });
    });

    describe("censorYargsArguments", () => {
        for (const opt of Censor.CENSORED_OPTIONS) {
            it(`should hide --${opt} operand`, () => {
                const data = Censor.censorYargsArguments({ _: [], $0: "test", [opt]: "cantSeeMe" });
                expect(data[opt]).toContain(Censor.CENSOR_RESPONSE);
            });
        }

        for (const opt of nonCensoredOptionsList) {
            it(`should not hide --${opt} operand`, () => {
                const data = Censor.censorYargsArguments({ _: [], $0: "test", [opt]: "canSeeMe" });
                expect(data[opt]).not.toContain(Censor.CENSOR_RESPONSE);
            });
        }

        it("should handle passing in multiple arguments and censor the not normally censored options if they match", () => {
            const args: any = {};
            args[Censor.CENSORED_OPTIONS[0]] = "cantSeeMe";
            for (const opt of nonCensoredOptionsList) {
                args[opt] = "cantSeeMe";
            }
            const data = Censor.censorYargsArguments({ _: [], $0: "test", ...args });
            expect(data[Censor.CENSORED_OPTIONS[0]]).toContain(Censor.CENSOR_RESPONSE);
            for (const opt of nonCensoredOptionsList) {
                expect(data[opt]).toContain(Censor.CENSOR_RESPONSE);
            }
        });
    });

    describe("profileSchemas getter", () => {
        let impConfigSpy: jest.SpyInstance = null;

        beforeEach(() => {
            (Censor as any).mSchema = null;
            impConfigSpy = jest.spyOn(ImperativeConfig, "instance", "get");
        });

        afterAll(() => {
            (Censor as any).mSchema = null;
            impConfigSpy.mockRestore();
        });

        it("should return the schema from ImperativeConfig", () => {
            const mockedProfiles = [{
                type: "test",
                schema: {
                    title: "Fake Profile Type",
                    description: "Fake Profile Description",
                    type: "object",
                    properties: {
                        test: {
                            type: "string",
                            optionDefinition: {
                                name: "test",
                                type: "string",
                                description: "Fake Test Description"
                            }
                        }
                    }
                }
            }];
            impConfigSpy.mockReturnValue({
                loadedConfig: {
                    profiles: mockedProfiles
                }
            });
            expect(Censor.profileSchemas).toEqual(mockedProfiles);
        });

        it("should return nothing", () => {
            impConfigSpy.mockReturnValue({});
            expect(Censor.profileSchemas).toEqual([]);
        });
    });

    describe("isSpecialValues", () => {
        let impConfigSpy: jest.SpyInstance = null;

        beforeEach(() => {
            (Censor as any).mSchema = null;
            impConfigSpy = jest.spyOn(ImperativeConfig, "instance", "get");
        });

        afterAll(() => {
            (Censor as any).mSchema = null;
            impConfigSpy.mockRestore();
        });

        describe("default list", () => {

            for(const opt of Censor.SECURE_PROMPT_OPTIONS) {
                it(`should return true for ${opt}`, () => {
                    expect(Censor.isSpecialValue("profiles.secret.properties." + opt)).toBe(true);
                });
            }

            for(const opt of Censor.CENSORED_OPTIONS) {
                if (!Censor.SECURE_PROMPT_OPTIONS.includes(opt)) {
                    it(`should return false for ${opt}`, () => {
                        expect(Censor.isSpecialValue("profiles.secret.properties." + opt)).toBe(false);
                    });
                }
            }
        });

        it("should return false for option 'test' when no profile schema is set", () => {
            expect(Censor.isSpecialValue("profiles.test.properties.test")).toBe(false);
        });

        it("should return true for option 'test' when profile schema is set 1", () => {
            const mockedProfiles = [{
                type: "test",
                schema: {
                    title: "Fake Profile Type",
                    description: "Fake Profile Description",
                    type: "object",
                    properties: {
                        test: {
                            type: "string",
                            secure: true,
                            optionDefinition: {
                                name: "test",
                                type: "string",
                                description: "Fake Test Description",
                            }
                        }
                    }
                }
            }];
            impConfigSpy.mockReturnValue({
                loadedConfig: {
                    profiles: mockedProfiles
                }
            });
            expect(Censor.isSpecialValue("profiles.test.properties.test")).toBe(true);
        });

        it("should return true for option 'test' when profile schema is set 2", () => {
            const mockedProfiles = [{
                type: "test",
                schema: {
                    title: "Fake Profile Type",
                    description: "Fake Profile Description",
                    type: "object",
                    properties: {
                        test: {
                            type: "string",
                            secure: true,
                            optionDefinitions: [{
                                name: "test1",
                                type: "string",
                                description: "Fake Test Description"
                            }, {
                                name: "test2",
                                type: "string",
                                description: "Fake Test Description"
                            }]
                        }
                    }
                }
            }];
            impConfigSpy.mockReturnValue({
                loadedConfig: {
                    profiles: mockedProfiles
                }
            });
            expect(Censor.isSpecialValue("profiles.test.properties.test")).toBe(false);
            expect(Censor.isSpecialValue("profiles.test.properties.test1")).toBe(true);
            expect(Censor.isSpecialValue("profiles.test.properties.test2")).toBe(true);
        });
    });

    describe("setProfileSchemas", () => {
        let impConfigSpy: jest.SpyInstance = null;

        beforeEach(() => {
            (Censor as any).mSchema = null;
            impConfigSpy = jest.spyOn(ImperativeConfig, "instance", "get");
        });

        afterAll(() => {
            (Censor as any).mSchema = null;
            impConfigSpy.mockRestore();
        });

        it("should initialize the schema object with nothing", () => {
            expect((Censor as any).mSchema).toBe(null);
            Censor.setProfileSchemas([]);
            expect((Censor as any).mSchema).toEqual([]);
        });

        it("should set the schema with a map", () => {
            const mockedProfiles = {
                title: "Fake Profile Type",
                description: "Fake Profile Description",
                type: "object",
                properties: {
                    test: {
                        type: "string",
                        secure: true,
                        optionDefinitions: [{
                            name: "test1",
                            type: "string",
                            description: "Fake Test Description"
                        }, {
                            name: "test2",
                            type: "string",
                            description: "Fake Test Description"
                        }]
                    }
                }
            };
            Censor.setProfileSchemas(new Map([["test", mockedProfiles]]));
            expect((Censor as any).mSchema).toEqual([{ type: "object", schema: mockedProfiles }]);
        });

        it("should set the schema with an IProfileTypeConfigration array", () => {
            const mockedProfiles = [{
                type: "test",
                schema: {
                    title: "Fake Profile Type",
                    description: "Fake Profile Description",
                    type: "object",
                    properties: {
                        test: {
                            type: "string",
                            secure: true,
                            optionDefinitions: [{
                                name: "test1",
                                type: "string",
                                description: "Fake Test Description"
                            }, {
                                name: "test2",
                                type: "string",
                                description: "Fake Test Description"
                            }]
                        }
                    }
                }
            }];

            Censor.setProfileSchemas(mockedProfiles);
            expect((Censor as any).mSchema).toEqual([{ type: "test", schema: mockedProfiles[0].schema }]);
        });
    });

    describe("handleSchema", () => {

        beforeEach(() => {
            Censor.setCensoredOptions();
            (Censor as any).mSchema = null;
        });

        it("should add secure props with an option definition to the secure array", () => {
            const fakeSchema = {
                type: "test",
                schema: {
                    title: "Fake Profile Type",
                    description: "Fake Profile Description",
                    type: "object",
                    properties: {
                        test: {
                            type: "string",
                            secure: true,
                            optionDefinition: {
                                name: "test",
                                type: "string",
                                description: "Fake Test Description",
                                aliases: ["test1", "t"]
                            }
                        }
                    }
                }
            };
            (Censor as any).handleSchema(fakeSchema);
            expect(Censor.CENSORED_OPTIONS).toContain("test");
            expect(Censor.CENSORED_OPTIONS).toContain("test1");
            expect(Censor.CENSORED_OPTIONS).toContain("t");
        });

        it("should add secure props with option definitions to the secure array", () => {
            const fakeSchema = {
                type: "test",
                schema: {
                    title: "Fake Profile Type",
                    description: "Fake Profile Description",
                    type: "object",
                    properties: {
                        test: {
                            type: "string",
                            secure: true,
                            optionDefinitions: [{
                                name: "test1",
                                type: "string",
                                description: "Fake Test Description"
                            }, {
                                name: "test2",
                                type: "string",
                                description: "Fake Test Description",
                                aliases: ["t"]
                            }]
                        }
                    }
                }
            };
            (Censor as any).handleSchema(fakeSchema);
            expect(Censor.CENSORED_OPTIONS).toContain("test1");
            expect(Censor.CENSORED_OPTIONS).toContain("test2");
            expect(Censor.CENSORED_OPTIONS).toContain("t");
        });
    });

    describe("setCensoredOptions", () => {

        beforeEach(() => {
            (Censor as any).mSchema = null;
            Censor.setCensoredOptions();
        });

        it("should reset the censored options when called with nothing", () => {
            (Censor as any).mConfig = "bad";
            (Censor as any).setCensoredOptions({});
            expect((Censor as any).mConfig).not.toEqual("bad");
        });

        it("should apply known profile schemas", () => {
            (Censor as any).mSchema = [{
                type: "test",
                schema: {
                    title: "Fake Profile Type",
                    description: "Fake Profile Description",
                    type: "object",
                    properties: {
                        test: {
                            type: "string",
                            secure: true,
                            optionDefinitions: [{
                                name: "test1",
                                type: "string",
                                description: "Fake Test Description"
                            }, {
                                name: "test2",
                                type: "string",
                                description: "Fake Test Description",
                                aliases: ["t"]
                            }]
                        }
                    }
                }
            }];
            expect(Censor.CENSORED_OPTIONS).not.toContain("test1");
            expect(Censor.CENSORED_OPTIONS).not.toContain("test2");
            expect(Censor.CENSORED_OPTIONS).not.toContain("t");

            Censor.setCensoredOptions();

            expect(Censor.CENSORED_OPTIONS).toContain("test1");
            expect(Censor.CENSORED_OPTIONS).toContain("test2");
            expect(Censor.CENSORED_OPTIONS).toContain("t");
        });

        it("should apply a profile schema if the command definition uses it (required)", () => {
            const censorOpts: ICensorOptions = {
                profiles: [{
                    type: "test",
                    schema: {
                        title: "Fake Profile Type",
                        description: "Fake Profile Description",
                        type: "object",
                        properties: {
                            test: {
                                type: "string",
                                secure: true,
                                optionDefinitions: [{
                                    name: "test1",
                                    type: "string",
                                    description: "Fake Test Description"
                                }, {
                                    name: "test2",
                                    type: "string",
                                    description: "Fake Test Description",
                                    aliases: ["t"]
                                }]
                            }
                        }
                    }
                }],
                commandDefinition: {
                    name: "test",
                    description: "test",
                    type: "command",
                    profile: {
                        required: ["test"]
                    }
                },
            }

            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).toContain("test1");
            expect(Censor.CENSORED_OPTIONS).toContain("test2");
            expect(Censor.CENSORED_OPTIONS).toContain("t");
        });

        it("should apply a profile schema if the command definition uses it (optional)", () => {
            const censorOpts: ICensorOptions = {
                profiles: [{
                    type: "test",
                    schema: {
                        title: "Fake Profile Type",
                        description: "Fake Profile Description",
                        type: "object",
                        properties: {
                            test: {
                                type: "string",
                                secure: true,
                                optionDefinitions: [{
                                    name: "test1",
                                    type: "string",
                                    description: "Fake Test Description"
                                }, {
                                    name: "test2",
                                    type: "string",
                                    description: "Fake Test Description",
                                    aliases: ["t"]
                                }]
                            }
                        }
                    }
                }],
                commandDefinition: {
                    name: "test",
                    description: "test",
                    type: "command",
                    profile: {
                        optional: ["test"]
                    }
                },
            }

            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).toContain("test1");
            expect(Censor.CENSORED_OPTIONS).toContain("test2");
            expect(Censor.CENSORED_OPTIONS).toContain("t");
        });

        it("should not apply a profile schema if the command definition doesn't use any profiles", () => {
            const censorOpts: ICensorOptions = {
                profiles: [{
                    type: "test",
                    schema: {
                        title: "Fake Profile Type",
                        description: "Fake Profile Description",
                        type: "object",
                        properties: {
                            test: {
                                type: "string",
                                secure: true,
                                optionDefinitions: [{
                                    name: "test1",
                                    type: "string",
                                    description: "Fake Test Description"
                                }, {
                                    name: "test2",
                                    type: "string",
                                    description: "Fake Test Description",
                                    aliases: ["t"]
                                }]
                            }
                        }
                    }
                }],
                commandDefinition: {
                    name: "test",
                    description: "test",
                    type: "command",
                    profile: {}
                },
            }

            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).not.toContain("test1");
            expect(Censor.CENSORED_OPTIONS).not.toContain("test2");
            expect(Censor.CENSORED_OPTIONS).not.toContain("t");
        });

        it("should not apply a profile schema if the command definition does not use it", () => {
            const censorOpts: ICensorOptions = {
                profiles: [{
                    type: "test",
                    schema: {
                        title: "Fake Profile Type",
                        description: "Fake Profile Description",
                        type: "object",
                        properties: {
                            test: {
                                type: "string",
                                secure: true,
                                optionDefinitions: [{
                                    name: "test1",
                                    type: "string",
                                    description: "Fake Test Description"
                                }, {
                                    name: "test2",
                                    type: "string",
                                    description: "Fake Test Description",
                                    aliases: ["t"]
                                }]
                            }
                        }
                    }
                }],
                commandDefinition: {
                    name: "test",
                    description: "test",
                    type: "command",
                    profile: {
                        optional: ["nottest"]
                    }
                },
            }

            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).not.toContain("test1");
            expect(Censor.CENSORED_OPTIONS).not.toContain("test2");
            expect(Censor.CENSORED_OPTIONS).not.toContain("t");
        });
    });
});
