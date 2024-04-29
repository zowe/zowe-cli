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

import * as path from "path";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("Search data sets", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "search_data_sets_integration",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", () => {
        const shellScript = path.join(__dirname, "__scripts__", "command_search_data_sets_help.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail due to missing data set name", () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "command_search_data_sets.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("Missing Positional Argument");
        expect(response.stderr.toString()).toContain("dataSetName");
    });

    it("should fail due to missing search parameter", () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "command_search_data_sets.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["IBMUSER.*"]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("Missing Positional Argument");
        expect(response.stderr.toString()).toContain("searchString");
    });

    it("should fail if the maximum concurrent requests are out of range 1", () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "command_search_data_sets.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["IBMUSER.*", "TESTDATA", "--max-concurrent-requests -1"]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("Invalid numeric value specified for option");
        expect(response.stderr.toString()).toContain("max-concurrent-requests");
        expect(response.stderr.toString()).toContain("1 and 99999");
        expect(response.stderr.toString()).toContain("-1");
    });

    it("should fail if the maximum concurrent requests are out of range 2", () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "command_search_data_sets.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["IBMUSER.*", "TESTDATA", "--max-concurrent-requests 100000"]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("Invalid numeric value specified for option");
        expect(response.stderr.toString()).toContain("max-concurrent-requests");
        expect(response.stderr.toString()).toContain("1 and 99999");
        expect(response.stderr.toString()).toContain("100000");
    });

});
