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

import 'jest-extended';
import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";
import { Censor } from "../src/Censor";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { ICensorOptions } from "../..";
import { ConfigSecure } from "../../config/src/api";

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

    it("should not change the default main censored options and headers", () => {
        expect(Censor.CENSORED_OPTIONS).toIncludeAllMembers([...Censor.DEFAULT_CENSORED_HEADERS, ...Censor.DEFAULT_CENSORED_OPTIONS]);
        expect(Censor.DEFAULT_CENSORED_OPTIONS).toMatchSnapshot();
        expect(Censor.DEFAULT_CENSORED_HEADERS).toMatchSnapshot();
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

    describe("censorSession", () => {
        const fakeUser = "fakeUser";
        const fakePassword = "fakePassword";
        const fakeB64Auth = "fakeBase64EncodedAuth";
        const unCensoredTokenType = "apimlAuthenticationToken";

        const fakeAvailCreds = {
            "user": fakeUser,
            "password": fakePassword,
            "base64EncodedAuth": fakeB64Auth,
            "tokenType": unCensoredTokenType,
            "tokenValue": "fakeTokenValue",
            "certFile": "./certFile.txt",
            "certKeyFile": "./certKeyFile.txt"
        };

        const fakeISess = {
            "rejectUnauthorized": false,
            "basePath": "",
            "protocol": "https",
            "hostname": "fakeHostName",
            "port": 1234,
            "user": fakeUser,
            "password": fakePassword,
            "type": "basic",
            "_authCache": {
                "availableCreds": fakeAvailCreds,
                "didUserSetAuthOrder": false
            },
            "authTypeOrder": [
                "basic",
                "cert-pem",
                "token"
            ],
            "strictSSL": true,
            "secureProtocol": "SSLv23_method",
            "base64EncodedAuth": fakeB64Auth
        };

        const fakeSession = {
            "mISession": fakeISess,
            "mLog": {
                "mJsLogger": {
                    "category": "imperative",
                    "context": {},
                    "callStackSkipIndex": 0
                },
                "category": "imperative",
                "initStatus": true
            }
        };

        it("should censor data in a Session object", () => {
            const censoredSessObj = JSON.parse(Censor.censorSession(fakeSession));
            expect(censoredSessObj.mISession._authCache.availableCreds.tokenType).toEqual(unCensoredTokenType);
            expect(censoredSessObj.mISession.user).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredSessObj.mISession.password).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredSessObj.mISession.base64EncodedAuth).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredSessObj.mISession._authCache.availableCreds.user).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredSessObj.mISession._authCache.availableCreds.password).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredSessObj.mISession._authCache.availableCreds.base64EncodedAuth).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredSessObj.mISession._authCache.availableCreds.tokenValue).toEqual(Censor.CENSOR_RESPONSE);
        });

        it("should censor data in an ISession object", () => {
            const censoredISessObj = JSON.parse(Censor.censorSession(fakeISess));
            expect(censoredISessObj._authCache.availableCreds.tokenType).toEqual(unCensoredTokenType);
            expect(censoredISessObj.user).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredISessObj.password).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredISessObj.base64EncodedAuth).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredISessObj._authCache.availableCreds.user).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredISessObj._authCache.availableCreds.password).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredISessObj._authCache.availableCreds.base64EncodedAuth).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredISessObj._authCache.availableCreds.tokenValue).toEqual(Censor.CENSOR_RESPONSE);
        });

        it("should throw an error when passed an invalid ISession object", () => {
            const parseSpy = jest.spyOn(JSON, 'parse').mockImplementation(() => {
                throw new Error("Invalid JSON");
            });
            let censoredString: string = "Not what we expect";
            let caughtErr: any;
            try {
                censoredString = Censor.censorSession(fakeISess);
            } catch(error) {
                caughtErr = error;
            }
            expect(caughtErr).toBe(undefined);
            expect(censoredString).toContain("Invalid session object");
            parseSpy.mockRestore(); // JSON.parse back to original app implementation
        });

        it("should censor data in an availableCreds object", () => {
            const censoredAvailCredsObj = JSON.parse(Censor.censorSession(fakeAvailCreds));
            expect(censoredAvailCredsObj.tokenType).toEqual(unCensoredTokenType);
            expect(censoredAvailCredsObj.user).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredAvailCredsObj.password).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredAvailCredsObj.base64EncodedAuth).toEqual(Censor.CENSOR_RESPONSE);
            expect(censoredAvailCredsObj.tokenValue).toEqual(Censor.CENSOR_RESPONSE);
        });

        it("should handle a null object", () => {
            const censoredNullStr = Censor.censorSession(null);
            expect(censoredNullStr).toEqual(Censor["NULL_SESS_OBJ_MSG"] + " censorSession");
        });

        it("should also handle a null object in replaceValsInSess", () => {
            const censoredNullStr = Censor["replaceValsInSess"](null, true);
            expect(censoredNullStr).toEqual(Censor["NULL_SESS_OBJ_MSG"] + " replaceValsInSess");
        });

        it("should handle a bogus JSON object", () => {
            const invalidJson = "{'invalidJson': true]";
            const censoredNullStr = Censor.censorSession(invalidJson);
            expect(censoredNullStr).toContain(invalidJson);
        });
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
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" }, showSecureArgs: { value: "FALSE" } });
                expect(Censor.censorRawData(secrets[1], "console")).toEqual(secrets[1]);
            });

            it("Console Output if the MASK_OUTPUT env var is FALSE and category is json", () => {
                impConfigSpy.mockReturnValue({
                    config: { exists: true, api: { secure: { findSecure }}, mProperties: { profiles: []}},
                    envVariablePrefix: "ZOWE"
                });
                findSecure.mockReturnValue([]);
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" }, showSecureArgs: { value: "FALSE" } });
                expect(Censor.censorRawData(secrets[1], "json")).toEqual(secrets[1]);
            });

            it("Console Output if the SHOW_SECURE_ARGS env var is FALSE and category is console", () => {
                impConfigSpy.mockReturnValue({
                    config: { exists: true, api: { secure: { findSecure }}, mProperties: { profiles: []}},
                    envVariablePrefix: "ZOWE"
                });
                findSecure.mockReturnValue([]);
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "TRUE" }, showSecureArgs: { value: "TRUE"}});
                const censoredData = Censor.censorRawData(secrets[1], "console");
                expect(censoredData).toEqual(secrets[1]);
            });

            it("Console Output if the SHOW_SECURE_ARGS env var is FALSE and category is json", () => {
                impConfigSpy.mockReturnValue({
                    config: { exists: true, api: { secure: { findSecure }}, mProperties: { profiles: []}},
                    envVariablePrefix: "ZOWE"
                });
                findSecure.mockReturnValue([]);
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "TRUE" }, showSecureArgs: { value: "TRUE" } });
                const censoredData = Censor.censorRawData(secrets[1], "json");
                expect(censoredData).toEqual(secrets[1]);
            });

            describe("special value:", () => {
                beforeEach(() => {
                    impConfig.config.mProperties = {profiles: {secret: { properties: {}}}, defaults: {}};
                    impConfigSpy.mockReturnValue(impConfig);
                    envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "TRUE" } });
                    (Censor as any).addCensoredOption("secret");
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

    describe("censorObject", () => {
        const secrets = ["secret0", "secret1"];
        let impConfigSpy: jest.SpyInstance = null;
        let envSettingsReadSpy: jest.SpyInstance = null;
        let findSecure: jest.SpyInstance = null;
        let mCensorObjectSpy: jest.SpyInstance = null;
        let impConfig: any = null; // tried Partial<ImperativeConfig> but some properties complain about missing functionality

        beforeEach(() => {
            jest.restoreAllMocks();
            findSecure = jest.fn();
            impConfigSpy = jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue(impConfig);
            envSettingsReadSpy = jest.spyOn(EnvironmentalVariableSettings, "read");
            mCensorObjectSpy = jest.spyOn(Censor, "mCensorObject" as any);

            envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" } });
            impConfig = {
                config: {
                    exists: true,
                    api: {
                        secure: { findSecure }
                    },
                    mProperties: {profiles: {secret: { properties: {}}}}
                }
            };
            Censor.setProfileSchemas(new Map());
        });

        afterAll(() => {
            impConfigSpy.mockRestore();
            envSettingsReadSpy.mockRestore();
            (Censor as any).mConfig = null;
        });

        it("should censor an object if the key is a secure key", () => {
            findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
            impConfig.config.mProperties.profiles.secret.properties = {secret: secrets[1] };
            const received = Censor.censorObject({secret: "some secret value"});
            const expected = {secret: Censor.CENSOR_RESPONSE};
            expect(received).toEqual(expected);
            expect(mCensorObjectSpy).toHaveBeenCalledTimes(1);
        });

        it("should censor an object if the value is a secure value", () => {
            findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
            impConfig.config.mProperties.profiles.secret.properties = {secret: secrets[1] };
            const received = Censor.censorObject({otherValue: secrets[1]});
            const expected = {otherValue: Censor.CENSOR_RESPONSE};
            expect(received).toEqual(expected);
            expect(mCensorObjectSpy).toHaveBeenCalledTimes(1);
        });

        it("should replace an object if the key is a secure key", () => {
            findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
            impConfig.config.mProperties.profiles.secret.properties = {secret: secrets[1] };
            const received = Censor.censorObject({secret: {data: "something", other: "something"}});
            const expected = {secret: Censor.CENSOR_RESPONSE};
            expect(received).toEqual(expected);
            expect(mCensorObjectSpy).toHaveBeenCalledTimes(1);
        });

        it("should iterate over an object and replace a secret key", () => {
            findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
            impConfig.config.mProperties.profiles.secret.properties = {secret: secrets[1] };
            const received = Censor.censorObject({data: {secret: secrets[1], other: "something"}});
            const expected = {data: {secret: Censor.CENSOR_RESPONSE, other: "something"}};
            expect(received).toEqual(expected);
            expect(mCensorObjectSpy).toHaveBeenCalledTimes(2);
        });

        it("should iterate over an object and replace a secret value", () => {
            findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
            impConfig.config.mProperties.profiles.secret.properties = {secret: secrets[1] };
            const received = Censor.censorObject({data: {data: secrets[1], other: "something"}});
            const expected = {data: {data: Censor.CENSOR_RESPONSE, other: "something"}};
            expect(received).toEqual(expected);
            expect(mCensorObjectSpy).toHaveBeenCalledTimes(2);
        });

        it("should not censor if nothing is secure", () => {
            findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
            impConfig.config.mProperties.profiles.secret.properties = {secret: secrets[1] };
            const data = {data: {data: "data", other: "something"}};
            const received = Censor.censorObject(data);
            expect(received).toEqual(data);
            expect(mCensorObjectSpy).toHaveBeenCalledTimes(2);
        });

        it("should censor an object if the key is a secure key with no config", () => {
            findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
            impConfig.config.exists = false;
            const received = Censor.censorObject({secret: "some secret value"});
            const expected = {secret: Censor.CENSOR_RESPONSE};
            expect(received).toEqual(expected);
            expect(mCensorObjectSpy).toHaveBeenCalledTimes(1);
        });

        it("should iterate over an object and replace a secret key with no config", () => {
            findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
            impConfig.config.exists = false;
            const received = Censor.censorObject({data: {secret: secrets[1], other: "something"}});
            const expected = {data: {secret: Censor.CENSOR_RESPONSE, other: "something"}};
            expect(received).toEqual(expected);
            expect(mCensorObjectSpy).toHaveBeenCalledTimes(2);
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

        it("should add secure props with no option definitions to the secure array", () => {
            const fakeSchema = {
                type: "test",
                schema: {
                    title: "Fake Profile Type",
                    description: "Fake Profile Description",
                    type: "object",
                    properties: {
                        test: {
                            type: "string",
                            secure: true
                        }
                    }
                }
            };
            (Censor as any).handleSchema(fakeSchema);
            expect(Censor.CENSORED_OPTIONS).toContain("test");
        });
    });

    describe("setCensoredOptions", () => {

        beforeEach(() => {
            (Censor as any).mSchema = null;
            Censor.setCensoredOptions();
        });

        it("should reset the censored options when called with nothing", () => {
            (Censor as any).mConfig = "bad";
            Censor.setCensoredOptions({});
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
            };

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
            };

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
            };

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
            };

            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).not.toContain("test1");
            expect(Censor.CENSORED_OPTIONS).not.toContain("test2");
            expect(Censor.CENSORED_OPTIONS).not.toContain("t");
        });

        it("should clear a previously stored schema if a new one is specified", () => {
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
                            }, {
                                name: "test3",
                                type: "string",
                                description: "Fake Test Description"
                            }]
                        }
                    }
                }
            }];

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
            };

            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).toContain("test1");
            expect(Censor.CENSORED_OPTIONS).toContain("test2");
            expect(Censor.CENSORED_OPTIONS).toContain("t");
            expect(Censor.CENSORED_OPTIONS).not.toContain("test3");
        });

        it("should apply a config without command definitions", () => {
            const censorOpts: ICensorOptions = {
                config: {
                    api: {
                        secure: new ConfigSecure({} as any)
                    },
                    mProperties: {
                        profiles: {
                            test1: {
                                secure: [
                                    "host",
                                    "port",
                                    "user"
                                ]
                            }
                        }
                    }
                } as any
            };
            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).toContain("host");
            expect(Censor.CENSORED_OPTIONS).toContain("port");
            expect(Censor.CENSORED_OPTIONS).toContain("user");
            expect(Censor.CENSORED_OPTIONS).toContain("password");
        });

        it("should apply a config with command definitions 1", () => {
            const profile = {
                test1: {
                    secure: [
                        "host",
                        "port",
                        "user"
                    ]
                }
            };
            const censorOpts: ICensorOptions = {
                config: {
                    api: {
                        secure: new ConfigSecure({
                            api: {
                                profiles: {
                                    getProfilePathFromName: jest.fn().mockReturnValue("profiles.test1")
                                }
                            },
                            mProperties: {
                                profiles: {
                                    ...profile
                                }
                            }
                        } as any),
                        profiles: {
                            get: jest.fn().mockReturnValue(profile)
                        }
                    },
                    mProperties: {
                        profiles: {
                            ...profile
                        }
                    }
                } as any,
                commandDefinition: {
                    profile: {
                        required: [
                            "test"
                        ]
                    }
                } as any,
                commandArguments: {
                    "test-profile": "test1"
                } as any
            };
            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).toContain("host");
            expect(Censor.CENSORED_OPTIONS).toContain("port");
            expect(Censor.CENSORED_OPTIONS).toContain("user");
            expect(Censor.CENSORED_OPTIONS).toContain("password");
        });

        it("should apply a config with command definitions 2", () => {
            const profile = {
                test1: {
                    secure: [
                        "host",
                        "port",
                        "user"
                    ]
                }
            };
            const censorOpts: ICensorOptions = {
                config: {
                    api: {
                        secure: new ConfigSecure({
                            api: {
                                profiles: {
                                    getProfilePathFromName: jest.fn().mockReturnValue("profiles.test1")
                                }
                            },
                            mProperties: {
                                profiles: {
                                    ...profile
                                }
                            }
                        } as any),
                        profiles: {
                            get: jest.fn().mockReturnValue(profile)
                        }
                    },
                    mProperties: {
                        profiles: {
                            ...profile
                        }
                    }
                } as any,
                commandDefinition: {
                    profile: {
                        optional: [
                            "test"
                        ]
                    }
                } as any,
                commandArguments: {
                    "test-profile": "test1"
                } as any
            };
            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).toContain("host");
            expect(Censor.CENSORED_OPTIONS).toContain("port");
            expect(Censor.CENSORED_OPTIONS).toContain("user");
            expect(Censor.CENSORED_OPTIONS).toContain("password");
        });

        it("should not apply a config with command definitions if the profile does not apply", () => {
            const profile = {
                test1: {
                    secure: [
                        "host",
                        "port",
                        "user"
                    ]
                }
            };
            const censorOpts: ICensorOptions = {
                config: {
                    api: {
                        secure: new ConfigSecure({
                            api: {
                                profiles: {
                                    getProfilePathFromName: jest.fn().mockReturnValue("profiles.test1")
                                }
                            },
                            mProperties: {
                                profiles: {
                                    ...profile
                                },
                                defaults: {}
                            }
                        } as any),
                        profiles: {
                            get: jest.fn().mockReturnValue(profile)
                        }
                    },
                    mProperties: {
                        profiles: {
                            ...profile
                        },
                        defaults: {}
                    }
                } as any,
                commandDefinition: {
                    profile: {
                        required: [
                            "nottest"
                        ]
                    }
                } as any,
                commandArguments: {
                    "test-profile": "test1"
                } as any
            };
            Censor.setCensoredOptions(censorOpts);

            expect(Censor.CENSORED_OPTIONS).not.toContain("host");
            expect(Censor.CENSORED_OPTIONS).not.toContain("port");
            expect(Censor.CENSORED_OPTIONS).not.toContain("user");
            expect(Censor.CENSORED_OPTIONS).toContain("password");
        });
    });
});
