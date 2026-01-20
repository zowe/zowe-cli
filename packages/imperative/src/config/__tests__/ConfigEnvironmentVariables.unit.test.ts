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
const originalEnvironment = process.env;

describe("Config Environment Variables", () => {

    afterEach(() => {
        process.env =  {...originalEnvironment};
    });

    describe("findEnvironmentVariables", () => {
        it("should not find an environment variable in a candidate", () => {
            const found = ConfigEnvironmentVariables.findEnvironmentVariables("$OMEVAR");
            expect(found).toEqual(new Set());
        });

        it("should find a simple environment variable in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            const found = ConfigEnvironmentVariables.findEnvironmentVariables("$VARIABLE");
            expect(found).toContain("VARIABLE");
        });

        it("should find multiple simple environment variables in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            process.env["VAR"] = "TEST";
            const found = ConfigEnvironmentVariables.findEnvironmentVariables("$VARIABLE-$VAR");
            expect(found).toContain("VARIABLE");
            expect(found).toContain("VAR");
        });

        it("should find a complex environment variable in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            const found = ConfigEnvironmentVariables.findEnvironmentVariables("${VARIABLE}");
            expect(found).toContain("VARIABLE");
        });

        it("should find multiple complex environment variables in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            process.env["VAR"] = "TEST";
            const found = ConfigEnvironmentVariables.findEnvironmentVariables("${VARIABLE}-${VAR}");
            expect(found).toContain("VARIABLE");
            expect(found).toContain("VAR");
        });

        it("should find a mix of simple and complex environment variables in a candidate", () => {
            process.env["VARIABLE"] = "TEST";
            process.env["VAR"] = "TEST";
            const found = ConfigEnvironmentVariables.findEnvironmentVariables("$VARIABLE-${VAR}");
            expect(found).toContain("VARIABLE");
            expect(found).toContain("VAR");
        });
    });

    describe("replaceEnvironmentVariablesInString", () => {
        it("should not replace an environment variable that is not defined", () => {
            const value = ConfigEnvironmentVariables.replaceEnvironmentVariablesInString("$VARIABLE");
            expect(value).toEqual("$VARIABLE");
        });

        it("should replace a simple environment variable", () => {
            process.env["VARIABLE"] = "TEST";
            const value = ConfigEnvironmentVariables.replaceEnvironmentVariablesInString("$VARIABLE");
            expect(value).toEqual("TEST");
        });

        it("should replace multiple simple environment variables", () => {
            process.env["VARIABLE"] = "TEST1";
            process.env["VAR"] = "TEST2";
            const value = ConfigEnvironmentVariables.replaceEnvironmentVariablesInString("$VARIABLE-$VAR");
            expect(value).toEqual("TEST1-TEST2");
        });

        it("should replace a complex environment variable", () => {
            process.env["VARIABLE"] = "TEST";
            const value = ConfigEnvironmentVariables.replaceEnvironmentVariablesInString("${VARIABLE}");
            expect(value).toEqual("TEST");
        });

        it("should replace multiple complex environment variables", () => {
            process.env["VARIABLE"] = "TEST1";
            process.env["VAR"] = "TEST2";
            const value = ConfigEnvironmentVariables.replaceEnvironmentVariablesInString("${VARIABLE}-${VAR}");
            expect(value).toEqual("TEST1-TEST2");
        });

        it("should replace a mix of simple and complex environment variables", () => {
            process.env["VARIABLE"] = "TEST1";
            process.env["VAR"] = "TEST2";
            const value = ConfigEnvironmentVariables.replaceEnvironmentVariablesInString("$VARIABLE-${VAR}");
            expect(value).toEqual("TEST1-TEST2");
        });

        it("should not replace an environment variable that is not defined but should replace one that does", () => {
            process.env["VAR"] = "TEST2";
            const value = ConfigEnvironmentVariables.replaceEnvironmentVariablesInString("$VARIABLE-$VAR");
            expect(value).toEqual("$VARIABLE-TEST2");
        });
    });
});