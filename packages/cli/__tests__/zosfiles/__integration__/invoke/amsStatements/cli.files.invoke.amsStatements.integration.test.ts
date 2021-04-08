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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("Invoke AMS CLI", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_invoke_ams_integration",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/invoke_ams_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail due to controlStatements not specified", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_missing_statement.sh", TEST_ENVIRONMENT);
        expect(stripNewLines(response.stderr.toString())).toContain("Syntax Error");
        expect(stripNewLines(response.stderr.toString())).toContain("Missing Positional");
        expect(stripNewLines(response.stderr.toString())).toContain("controlStatements");
    });
});
