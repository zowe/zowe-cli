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

import { ConfigEnvironmentVariables } from "../src/ConfigEnvironmentVariables";
import { ConfigUtils, type Config, type IConfigLayer } from "..";
import type { IConfigEnvVarManaged } from "../src/doc/IConfigEnvVarManaged";
const originalEnvironment = process.env;

describe("Config Environment Variables", () => {

    afterEach(() => {
        process.env =  {...originalEnvironment};
    });

    describe("replaceEnvironmentVariablesInConfigLayer", () => {
        let replaceEnvironmentVariablesInConfigLayerSpy: jest.SpyInstance;
        let replaceEnvironmentVariablesInStringSpy: jest.SpyInstance;
        let coercePropValueSpy: jest.SpyInstance;
        const fakeConfig: Partial<Config> = {mEnvVarManaged: []};
        const fakeLayer: Partial<IConfigLayer> = {
            global: false,
            user: false
        };

        beforeEach(() => {
            replaceEnvironmentVariablesInConfigLayerSpy = jest.spyOn(ConfigEnvironmentVariables, "replaceEnvironmentVariablesInConfigLayer");
            replaceEnvironmentVariablesInStringSpy = jest.spyOn(ConfigEnvironmentVariables as any, "replaceEnvironmentVariablesInString");
            coercePropValueSpy = jest.spyOn(ConfigUtils, "coercePropValue").mockImplementation((value) => { return value; });
        });

        afterEach(() => {
            fakeConfig.mEnvVarManaged = [];
            fakeLayer.global = false;
            fakeLayer.user = false;
            jest.restoreAllMocks();
        });

        it("should not find any environment variables to replace", () => {
            const configObject = {
                fake: {
                    properties: {
                        user: "fakeuser",
                        password: "fakepassword",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.replaceEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any, "profiles");
            expect(fakeConfig.mEnvVarManaged?.length).toEqual(0);
            expect(replaceEnvironmentVariablesInStringSpy).not.toHaveBeenCalled();
            expect(coercePropValueSpy).not.toHaveBeenCalled();
            expect(replaceEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
        });

        it("should replace a simple environment variable", () => {
            process.env["TESTVALUE"] = "notarealuser";
            const configObject = {
                fake: {
                    properties: {
                        user: "$TESTVALUE",
                        password: "fakepassword",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.replaceEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any, "profiles");
            expect(fakeConfig.mEnvVarManaged?.length).toEqual(1);
            expect(replaceEnvironmentVariablesInStringSpy).toHaveBeenCalledTimes(1);
            expect(coercePropValueSpy).toHaveBeenCalledTimes(1);
            expect(replaceEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
            expect(configObject.fake.properties.user).toEqual("notarealuser");
            expect(fakeConfig.mEnvVarManaged?.[0]).toEqual({
                global: false,
                user: false,
                propPath: "profiles.fake.properties.user",
                originalValue: "$TESTVALUE",
                replacementValue: "notarealuser"
            });
        });

        it("should replace a complex environment variable", () => {
            process.env["TESTVALUE"] = "notarealuser";
            const configObject = {
                fake: {
                    properties: {
                        user: "${TESTVALUE}",
                        password: "fakepassword",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.replaceEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any, "profiles");
            expect(fakeConfig.mEnvVarManaged?.length).toEqual(1);
            expect(replaceEnvironmentVariablesInStringSpy).toHaveBeenCalledTimes(1);
            expect(coercePropValueSpy).toHaveBeenCalledTimes(1);
            expect(replaceEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
            expect(configObject.fake.properties.user).toEqual("notarealuser");
            expect(fakeConfig.mEnvVarManaged?.[0]).toEqual({
                global: false,
                user: false,
                propPath: "profiles.fake.properties.user",
                originalValue: "${TESTVALUE}",
                replacementValue: "notarealuser"
            });
        });

        it("should replace one of each type of environment variable", () => {
            process.env["TESTVALUE"] = "notarealuser";
            process.env["TESTPASS"] = "notarealpassword";
            const configObject = {
                fake: {
                    properties: {
                        user: "${TESTVALUE}",
                        password: "${TESTPASS}",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.replaceEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any, "profiles");
            expect(fakeConfig.mEnvVarManaged?.length).toEqual(2);
            expect(replaceEnvironmentVariablesInStringSpy).toHaveBeenCalledTimes(2);
            expect(coercePropValueSpy).toHaveBeenCalledTimes(2);
            expect(replaceEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
            expect(configObject.fake.properties.user).toEqual("notarealuser");
            expect(configObject.fake.properties.password).toEqual("notarealpassword");
            expect((fakeConfig.mEnvVarManaged as IConfigEnvVarManaged[])[0]).toEqual({
                global: false,
                user: false,
                propPath: "profiles.fake.properties.user",
                originalValue: "${TESTVALUE}",
                replacementValue: "notarealuser"
            });
            expect((fakeConfig.mEnvVarManaged as IConfigEnvVarManaged[])[1]).toEqual({
                global: false,
                user: false,
                propPath: "profiles.fake.properties.password",
                originalValue: "${TESTPASS}",
                replacementValue: "notarealpassword"
            });
        });

        it("should use an empty path if one is not provided", () => {
            process.env["TESTVALUE"] = "notarealuser";
            const configObject = {
                fake: {
                    properties: {
                        user: "$TESTVALUE",
                        password: "fakepassword",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.replaceEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any);
            expect(fakeConfig.mEnvVarManaged?.length).toEqual(1);
            expect(replaceEnvironmentVariablesInStringSpy).toHaveBeenCalledTimes(1);
            expect(coercePropValueSpy).toHaveBeenCalledTimes(1);
            expect(replaceEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
            expect(configObject.fake.properties.user).toEqual("notarealuser");
            expect(fakeConfig.mEnvVarManaged?.[0]).toEqual({
                global: false,
                user: false,
                propPath: ".fake.properties.user",
                originalValue: "$TESTVALUE",
                replacementValue: "notarealuser"
            });
        });

    });

    describe("restoreEnvironmentVariablesInConfigLayer", () => {
        let restoreEnvironmentVariablesInConfigLayerSpy: jest.SpyInstance;
        const fakeConfig: Partial<Config> = {mEnvVarManaged: []};
        const fakeLayer: Partial<IConfigLayer> = {
            global: false,
            user: false
        };

        beforeEach(() => {
            restoreEnvironmentVariablesInConfigLayerSpy = jest.spyOn(ConfigEnvironmentVariables, "restoreEnvironmentVariablesInConfigLayer");
        });

        afterEach(() => {
            fakeConfig.mEnvVarManaged = [];
            fakeLayer.global = false;
            fakeLayer.user = false;
            jest.restoreAllMocks();
        });

        it("should find nothing to restore", () => {
            const configObject = {
                fake: {
                    properties: {
                        user: "fakeuser",
                        password: "fakepassword",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.restoreEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any, "profiles");
            expect(restoreEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
            expect(configObject.fake.properties.user).toEqual("fakeuser");
        });

        it("should restore a simple environment variable", () => {
            fakeConfig.mEnvVarManaged?.push({
                global: false,
                user: false,
                propPath: "profiles.fake.properties.user",
                originalValue: "$TESTVALUE",
                replacementValue: "fakeuser"
            });
            const configObject = {
                fake: {
                    properties: {
                        user: "fakeuser",
                        password: "fakepassword",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.restoreEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any, "profiles");
            expect(restoreEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
            expect(configObject.fake.properties.user).toEqual("$TESTVALUE");
        });

        it("should restore a complex environment variable", () => {
            fakeConfig.mEnvVarManaged?.push({
                global: false,
                user: false,
                propPath: "profiles.fake.properties.user",
                originalValue: "${TESTVALUE}",
                replacementValue: "fakeuser"
            });
            const configObject = {
                fake: {
                    properties: {
                        user: "fakeuser",
                        password: "fakepassword",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.restoreEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any, "profiles");
            expect(restoreEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
            expect(configObject.fake.properties.user).toEqual("${TESTVALUE}");
        });

        it("should restore both types of environment variable", () => {
            fakeConfig.mEnvVarManaged?.push({
                global: false,
                user: false,
                propPath: "profiles.fake.properties.user",
                originalValue: "$TESTVALUE",
                replacementValue: "fakeuser"
            });
            fakeConfig.mEnvVarManaged?.push({
                global: false,
                user: false,
                propPath: "profiles.fake.properties.password",
                originalValue: "${TESTPASS}",
                replacementValue: "fakepassword"
            });
            const configObject = {
                fake: {
                    properties: {
                        user: "fakeuser",
                        password: "fakepassword",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.restoreEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any, "profiles");
            expect(restoreEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
            expect(configObject.fake.properties.user).toEqual("$TESTVALUE");
            expect(configObject.fake.properties.password).toEqual("${TESTPASS}");
        });

        it("should should use an empty path if none is provided", () => {
            fakeConfig.mEnvVarManaged?.push({
                global: false,
                user: false,
                propPath: ".fake.properties.user",
                originalValue: "$TESTVALUE",
                replacementValue: "fakeuser"
            });
            const configObject = {
                fake: {
                    properties: {
                        user: "fakeuser",
                        password: "fakepassword",
                        port: 1234,
                        host: "fakehost.fakedomain.fake"
                    }
                }
            };
            ConfigEnvironmentVariables.restoreEnvironmentVariablesInConfigLayer(configObject, fakeConfig as any, fakeLayer as any);
            expect(restoreEnvironmentVariablesInConfigLayerSpy).toHaveBeenCalledTimes(3);
            expect(configObject.fake.properties.user).toEqual("$TESTVALUE");
        });
    });

    describe("findEnvironmentVariables", () => {
        it("should not find an environment variable in a candidate", () => {
            const found = (ConfigEnvironmentVariables as any).findEnvironmentVariables("$OMEVAR");
            expect(found).toEqual(new Set());
        });

        it("should find a simple environment variable in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            const found = (ConfigEnvironmentVariables as any).findEnvironmentVariables("$VARIABLE");
            expect(found).toContain("VARIABLE");
        });

        it("should find multiple simple environment variables in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            process.env["VAR"] = "TEST";
            const found = (ConfigEnvironmentVariables as any).findEnvironmentVariables("$VARIABLE-$VAR");
            expect(found).toContain("VARIABLE");
            expect(found).toContain("VAR");
        });

        it("should find a complex environment variable in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            const found = (ConfigEnvironmentVariables as any).findEnvironmentVariables("${VARIABLE}");
            expect(found).toContain("VARIABLE");
        });

        it("should find multiple complex environment variables in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            process.env["VAR"] = "TEST";
            const found = (ConfigEnvironmentVariables as any).findEnvironmentVariables("${VARIABLE}-${VAR}");
            expect(found).toContain("VARIABLE");
            expect(found).toContain("VAR");
        });

        it("should find a mix of simple and complex environment variables in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            process.env["VAR"] = "TEST";
            const found = (ConfigEnvironmentVariables as any).findEnvironmentVariables("$VARIABLE-${VAR}");
            expect(found).toContain("VARIABLE");
            expect(found).toContain("VAR");
        });
    });

    describe("replaceEnvironmentVariablesInString", () => {
        it("should not replace an environment variable that is not defined", () => {
            const value = (ConfigEnvironmentVariables as any).replaceEnvironmentVariablesInString("$VARIABLE");
            expect(value).toEqual("$VARIABLE");
        });

        it("should replace a simple environment variable", () => {
            process.env["VARIABLE"] = "TEST";
            const value = (ConfigEnvironmentVariables as any).replaceEnvironmentVariablesInString("$VARIABLE");
            expect(value).toEqual("TEST");
        });

        it("should replace multiple simple environment variables", () => {
            process.env["VARIABLE"] = "TEST1";
            process.env["VAR"] = "TEST2";
            const value = (ConfigEnvironmentVariables as any).replaceEnvironmentVariablesInString("$VARIABLE-$VAR");
            expect(value).toEqual("TEST1-TEST2");
        });

        it("should replace a complex environment variable", () => {
            process.env["VARIABLE"] = "TEST";
            const value = (ConfigEnvironmentVariables as any).replaceEnvironmentVariablesInString("${VARIABLE}");
            expect(value).toEqual("TEST");
        });

        it("should replace multiple complex environment variables", () => {
            process.env["VARIABLE"] = "TEST1";
            process.env["VAR"] = "TEST2";
            const value = (ConfigEnvironmentVariables as any).replaceEnvironmentVariablesInString("${VARIABLE}-${VAR}");
            expect(value).toEqual("TEST1-TEST2");
        });

        it("should replace a mix of simple and complex environment variables", () => {
            process.env["VARIABLE"] = "TEST1";
            process.env["VAR"] = "TEST2";
            const value = (ConfigEnvironmentVariables as any).replaceEnvironmentVariablesInString("$VARIABLE-${VAR}");
            expect(value).toEqual("TEST1-TEST2");
        });

        it("should not replace an environment variable that is not defined but should replace one that does", () => {
            process.env["VAR"] = "TEST2";
            const value = (ConfigEnvironmentVariables as any).replaceEnvironmentVariablesInString("$VARIABLE-$VAR");
            expect(value).toEqual("$VARIABLE-TEST2");
        });
    });

    describe("replaceRegexText", () => {
        it("should replace the regex text with something else", () => {
            const testString = "SOME RANDOM TEXT";
            const regex = /RANDOM/g;
            const replacementText = "NORMAL";
            const match = regex.exec(testString);
            const returnedText = (ConfigEnvironmentVariables as any).replaceRegexText(testString, match, replacementText);
            expect(returnedText).toEqual("SOME NORMAL TEXT");
        });
    });
});