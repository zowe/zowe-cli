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
import { LoggerUtils } from "../src/LoggerUtils";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { Censor } from "../..";

afterAll(() => {
    jest.restoreAllMocks();
});

/* eslint-disable deprecation/deprecation */
describe("LoggerUtils tests", () => {

    it("Should hide --password operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--password", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide --token-value operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--token-value", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide --cert-file-passphrase operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--cert-file-passphrase", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide --authentication operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--authentication", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide --pw operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--pw", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should not hide --not-secret operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--not-secret", "canSeeMe"]);
        expect(data).not.toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide password operand", () => {
        const data = LoggerUtils.censorYargsArguments({ _: [], $0: "test", password: "cantSeeMe" });
        expect(data.password).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should not hide notSecret operand", () => {
        const data = LoggerUtils.censorYargsArguments({ _: [], $0: "test", notSecret: "canSeeMe" });
        expect(data.notSecret).not.toContain(LoggerUtils.CENSOR_RESPONSE);
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
            LoggerUtils.setProfileSchemas(new Map());
        });

        describe("should NOT censor", () => {
            it("data if we are using old profiles", () => {
                impConfigSpy.mockReturnValue({ config: { exists: false } });
                expect(LoggerUtils.censorRawData(secrets[0])).toEqual(secrets[0]);
            });

            it("Console Output if the MASK_OUTPUT env var is FALSE", () => {
                impConfigSpy.mockReturnValue({ config: { exists: true, api: { secure: { findSecure }}, mProperties: { profiles: []}}});
                findSecure.mockReturnValue([]);
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" } });
                expect(LoggerUtils.censorRawData(secrets[1], "console")).toEqual(secrets[1]);
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

                    const received = LoggerUtils.censorRawData(`visible secret: ${secrets[0]}, masked secret: ${secrets[1]}`);
                    const expected = `visible secret: ${secrets[0]}, masked secret: ${LoggerUtils.CENSOR_RESPONSE}`;
                    return [received, expected];
                };

                it("user", () => {
                    const [received, expected] = _lazyTest("user");
                    expect(received).toEqual(expected);
                });
                it("password", () => {
                    const [received, expected] = _lazyTest("password");
                    expect(received).toEqual(expected);
                });
                it("tokenValue", () => {
                    const [received, expected] = _lazyTest("tokenValue");
                    expect(received).toEqual(expected);
                });
            });
        });

        describe("should censor", () => {
            beforeEach(() => {
                impConfig.config.mProperties = {profiles: {secret: { properties: {}}}};
                impConfigSpy.mockReturnValue(impConfig);
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" } });
            });
            it("data if the logger category is not console, regardless of the MASK_OUTPUT env var value", () => {
                findSecure.mockReturnValue(["profiles.secret.properties.secret"]);
                impConfig.config.mProperties.profiles.secret.properties = {secret: secrets[1] };
                const received = LoggerUtils.censorRawData(`masked secret: ${secrets[1]}`, "This is not the console");
                const expected = `masked secret: ${LoggerUtils.CENSOR_RESPONSE}`;
                expect(received).toEqual(expected);
            });
        });
    });

    describe("isSpecialValue", () => {
        let impConfigSpy: jest.SpyInstance = null;

        beforeEach(() => {
            (Censor as any).mSchema = null;
            impConfigSpy = jest.spyOn(ImperativeConfig, "instance", "get");
        });

        afterAll(() => {
            (Censor as any).mSchema = null;
        });

        it("should check if user is a special value", () => {
            expect(LoggerUtils.isSpecialValue("profiles.test.properties.user")).toBe(true);
        });
    });

    it("should get profile schemas from Censor", () => {
        const schemaSpy = jest.spyOn(Censor, "profileSchemas", "get");
        expect(LoggerUtils.profileSchemas).toEqual(Censor.profileSchemas);
        expect(schemaSpy).toHaveBeenCalledTimes(2);
    });
});
