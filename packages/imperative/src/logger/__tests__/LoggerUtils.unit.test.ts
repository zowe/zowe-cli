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

import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";
import { LoggerUtils } from "../../logger";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";

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

    it("Should hide -p operand", () => {
        const data = LoggerUtils.censorCLIArgs(["-p", "cantSeeMe"]);
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
        let secureFields: jest.SpyInstance = null;
        let layersGet: jest.SpyInstance = null;
        let impConfig: any = null; // tried Partial<ImperativeConfig> but some properties complain about missing functionality
        beforeEach(() => {
            jest.restoreAllMocks();
            secureFields = jest.fn();
            layersGet = jest.fn();
            impConfigSpy = jest.spyOn(ImperativeConfig, "instance", "get");
            envSettingsReadSpy = jest.spyOn(EnvironmentalVariableSettings, "read");
            impConfig = {
                config: {
                    exists: true,
                    api: {
                        layers: { get: layersGet },
                        secure: { secureFields }
                    }
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
                impConfigSpy.mockReturnValue({ config: { exists: true } });
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" } });
                expect(LoggerUtils.censorRawData(secrets[1], "console")).toEqual(secrets[1]);
            });

            describe("special value:", () => {
                beforeEach(() => {
                    impConfigSpy.mockReturnValue(impConfig);
                    envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "TRUE" } });
                });

                const _lazyTest = (prop: string): [string, string] => {
                    secureFields.mockReturnValue([`secret.${prop}`, "secret.secret"]);
                    layersGet.mockReturnValue({ properties: { secret: { [prop]: secrets[0], secret: secrets[1] } } });

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
                impConfigSpy.mockReturnValue(impConfig);
                envSettingsReadSpy.mockReturnValue({ maskOutput: { value: "FALSE" } });
            });
            it("data if the logger category is not console, regardless of the MASK_OUTPUT env var value", () => {
                secureFields.mockReturnValue(["secret.secret"]);
                layersGet.mockReturnValue({ properties: { secret: { secret: secrets[1] } } });
                const received = LoggerUtils.censorRawData(`masked secret: ${secrets[1]}`, "This is not the console");
                const expected = `masked secret: ${LoggerUtils.CENSOR_RESPONSE}`;
                expect(received).toEqual(expected);
            });
        });
    });
});
