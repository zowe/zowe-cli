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

    describe("censorCommandLine", () => {
        it("should censor a sensitive option supplied in the space-separated form", () => {
            const result = LoggerUtils.censorCommandLine("zowe cmd --password secret --port 443");
            expect(result).toContain(`--password ${LoggerUtils.CENSOR_RESPONSE}`);
            expect(result).not.toContain("secret");
            // non-secure option should be untouched
            expect(result).toContain("--port 443");
        });

        it("should censor a sensitive option supplied in the equals-separated form", () => {
            const result = LoggerUtils.censorCommandLine("zowe cmd --password=secret");
            expect(result).toContain(`--password ${LoggerUtils.CENSOR_RESPONSE}`);
            expect(result).not.toContain("secret");
        });

        it("should censor a sensitive short option supplied in the equals-separated form when its value is known", () => {
            const result = LoggerUtils.censorCommandLine("zowe cmd -p=secret", { _: [], $0: "", password: "secret" });
            expect(result).toContain(LoggerUtils.CENSOR_RESPONSE);
            expect(result).not.toContain("secret");
        });

        it("should censor a sensitive value that contains embedded whitespace when the parsed args are supplied", () => {
            const result = LoggerUtils.censorCommandLine("zowe cmd --password two words", { _: [], $0: "", password: "two words" });
            expect(result).toContain(`--password ${LoggerUtils.CENSOR_RESPONSE}`);
            expect(result).not.toContain("two words");
            // the tail of the value must not leak
            expect(result).not.toMatch(/\bwords\b/);
        });

        it("should not consume the boundary of a preceding argument", () => {
            const result = LoggerUtils.censorCommandLine("zowe cmd --port 443 --password=secret");
            expect(result).toContain("--port 443");
            expect(result).toContain(`--password ${LoggerUtils.CENSOR_RESPONSE}`);
        });

        it("should not censor non-sensitive options", () => {
            const commandLine = "zowe cmd --host example.com --port 443";
            const result = LoggerUtils.censorCommandLine(commandLine);
            expect(result).toEqual(commandLine);
            expect(result).not.toContain(LoggerUtils.CENSOR_RESPONSE);
        });

        it("should ignore the reserved yargs keys ($0 and _) when censoring by value", () => {
            const result = LoggerUtils.censorCommandLine("zowe cmd example", { _: ["cmd", "example"], $0: "zowe" });
            expect(result).toEqual("zowe cmd example");
        });

        it.each([null, undefined, ""])("should return %p unchanged", (input) => {
            expect(LoggerUtils.censorCommandLine(input as any)).toEqual(input);
        });
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

    describe("isSecureEnvName", () => {
        for (const name of ["ZOWE_OPT_PASSWORD", "ZOWE_OPT_TOKEN_VALUE", "ZOWE_OPT_CERT_FILE_PASSPHRASE",
            "AWS_SECRET_ACCESS_KEY", "GITHUB_TOKEN", "MY_API_CREDENTIAL", "SOME_AUTH_HEADER", "private_key"]) {
            it(`should identify "${name}" as sensitive`, () => {
                expect(LoggerUtils.isSecureEnvName(name)).toBe(true);
            });
        }

        for (const name of ["PATH", "HOME", "PWD", "ZOWE_OPT_HOST", "ZOWE_OPT_PORT", "ZOWE_OPT_USER", "LANG", "SHELL"]) {
            it(`should not identify "${name}" as sensitive`, () => {
                expect(LoggerUtils.isSecureEnvName(name)).toBe(false);
            });
        }

        it("should not throw on a null or undefined name", () => {
            expect(LoggerUtils.isSecureEnvName(null)).toBe(false);
            expect(LoggerUtils.isSecureEnvName(undefined)).toBe(false);
        });
    });

    describe("censorEnvVariables", () => {
        beforeEach(() => {
            jest.restoreAllMocks();
            // Default: no usable config, so only name-based redaction applies
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({ config: { exists: false } } as any);
        });

        it("should redact env vars whose names match a credential pattern", () => {
            const env = {
                ZOWE_OPT_PASSWORD: "superSecret",
                ZOWE_OPT_TOKEN_VALUE: "myToken",
                AWS_SECRET_ACCESS_KEY: "awsSecret",
                GITHUB_TOKEN: "ghToken"
            } as any;
            const received = JSON.parse(LoggerUtils.censorEnvVariables(env));
            expect(received.ZOWE_OPT_PASSWORD).toEqual(LoggerUtils.CENSOR_RESPONSE);
            expect(received.ZOWE_OPT_TOKEN_VALUE).toEqual(LoggerUtils.CENSOR_RESPONSE);
            expect(received.AWS_SECRET_ACCESS_KEY).toEqual(LoggerUtils.CENSOR_RESPONSE);
            expect(received.GITHUB_TOKEN).toEqual(LoggerUtils.CENSOR_RESPONSE);
        });

        it("should preserve env vars whose names are not sensitive", () => {
            const env = { PATH: "/usr/bin", ZOWE_OPT_HOST: "example.com", ZOWE_OPT_PORT: "443" } as any;
            const received = JSON.parse(LoggerUtils.censorEnvVariables(env));
            expect(received.PATH).toEqual("/usr/bin");
            expect(received.ZOWE_OPT_HOST).toEqual("example.com");
            expect(received.ZOWE_OPT_PORT).toEqual("443");
        });

        it("should default to process.env when no environment is supplied", () => {
            process.env.CENSOR_UNIT_TEST_PASSWORD = "shouldBeHidden";
            process.env.CENSOR_UNIT_TEST_HOST = "shouldBeVisible";
            try {
                const received = JSON.parse(LoggerUtils.censorEnvVariables());
                expect(received.CENSOR_UNIT_TEST_PASSWORD).toEqual(LoggerUtils.CENSOR_RESPONSE);
                expect(received.CENSOR_UNIT_TEST_HOST).toEqual("shouldBeVisible");
            } finally {
                delete process.env.CENSOR_UNIT_TEST_PASSWORD;
                delete process.env.CENSOR_UNIT_TEST_HOST;
            }
        });
    });
});
