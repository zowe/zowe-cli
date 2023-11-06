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

import { ITestEnvironment } from "../../../../../../../packages/core/__tests__/__resources__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../packages/core/__tests__/__resources__/__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../../packages/core/__tests__/__resources__/src/TestUtil";
import { ICommandResponse } from "../../../../../../../../packages/core/src/cmd/doc";
import * as fs from "fs";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("cmd-cli invoke test-async-handler", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_test_async_handler"
        });
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-async-handler/invoke_test_async_handler_help.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should detect if the mutually exclusive fail options are specified", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-async-handler/invoke_test_async_handler_invalid_parms.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail a handler if an imperative error is thrown", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-async-handler/invoke_test_async_handler_fail_ie.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail a handler if a generic error is thrown", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-async-handler/invoke_test_async_handler_fail_ge.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);

        // Ensure that the stderr field matches the expected regex - some non-deterministic data is contained within
        const regex = fs.readFileSync(__dirname + "/__regex__/test-async-handler/invoke_test_async_handler_fail_ge.regex").toString();
        expect(new RegExp(regex, "g").test(response.stderr.toString())).toBe(true);
    });

    it("should fail a handler if a generic error is thrown and produce a JSON response", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-async-handler/invoke_test_async_handler_fail_ge_rfj.sh",
            TEST_ENVIRONMENT.workingDir);

        // Script status code should be 1 from imperative cli
        expect(response.status).toBe(1);

        // Verify that we can parse the stdout string into a JSON object
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());

        // Check the properties of the object for correctness
        expect(respObj.success).toBe(false);
        expect(respObj.message).toBe("Unexpected Command Error: Fail with Error");
        expect(respObj.error.msg).toBe("Fail with Error");
        expect(respObj.error.stack).toContain("Error: Fail with Error");
        expect(respObj.stdout).toBe("");

        // Ensure that the stderr field matches the expected regex - some non-deterministic data is contained within
        const regex = fs.readFileSync(__dirname + "/__regex__/test-async-handler/invoke_test_async_handler_fail_ge.regex").toString();
        expect(new RegExp(regex, "g").test(respObj.stderr.toString())).toBe(true);
    });
});
