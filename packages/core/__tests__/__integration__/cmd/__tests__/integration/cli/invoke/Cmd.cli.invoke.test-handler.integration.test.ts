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

import { ITestEnvironment } from "../../../../../../__resources__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__resources__/__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../__resources__/src/TestUtil";
import { ICommandResponse } from "../../../../../../../src/cmd";
import * as fs from "fs";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("cmd-cli invoke test-handler", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_test_handler"
        });
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_help.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fulfill the promise and complete the command successfully", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_fulfill_promise.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fulfill the promise and complete the command successfully with a JSON response", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_fulfill_promise_rfj.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");

        // Attempt to convert response to an object
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());

        // Check the fields of the response object
        expect(respObj.success).toBe(true);
        expect(respObj.stdout).toMatchSnapshot();
        expect(respObj.message).toBe("");
        expect(respObj.stderr).toBe("");
        expect(respObj.error).toBeUndefined();
    });

    it("should fail the command if fail-with-message is specified and no message is supplied", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_fail_with_message_invalid.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toBe("");
        expect(response.stderr.toString()).toMatchSnapshot();
    });

    it("should fail the command if fail-with-message is specified with a message", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_fail_with_message.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toBe("");
        expect(response.stderr.toString()).toMatchSnapshot();
    });

    it("should fail the command if fail-with-message is specified with a message and produce a JSON response", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_fail_with_message_rfj.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);

        // Attempt to convert response to an object
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());

        // Check the fields of the response object
        expect(respObj.success).toBe(false);
        expect(respObj.stdout).toBe("");
        expect(respObj.stderr).toMatchSnapshot();
        expect(respObj.error.msg).toMatchSnapshot();
    });

    it("should fail a handler if a generic error is thrown", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_fail_ge.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);

        // Ensure that the stderr field matches the expected regex - some non-deterministic data is contained within
        const regex = fs.readFileSync(__dirname + "/__regex__/test-handler/invoke_test_handler_fail_ge.regex").toString();
        expect(new RegExp(regex, "g").test(response.stderr.toString())).toBe(true);
    });

    it("should fail a handler if a generic error is thrown and produce a JSON response", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_fail_ge_rfj.sh", TEST_ENVIRONMENT.workingDir);

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
        const regex = fs.readFileSync(__dirname + "/__regex__/test-handler/invoke_test_handler_fail_ge.regex").toString();
        expect(new RegExp(regex, "g").test(respObj.stderr.toString())).toBe(true);
    });

    it("should fail a handler if an imperative error is thrown", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_fail_ie.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("Fail with Imperative Error");
        expect(response.stdout.toString()).toBe("");
    });

    it("should fail a handler if an imperative error is thrown and produce a JSON response", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_fail_ie_rfj.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);

        // Verify that we can parse the stdout string into a JSON object
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());

        // Check the properties of the object for correctness
        expect(respObj.success).toBe(false);
        expect(respObj.message).toBe("Fail with Imperative Error");
        expect(respObj.error.msg).toBe("Fail with Imperative Error");
        expect(respObj.stdout).toBe("");
        expect(respObj.stderr).toContain("Fail with Imperative Error");
        expect(response.stderr.toString()).toBe("");
    });

    it("should invoke the handler and print a message if no options are specified", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    // TODO - Not fulfilling the promise causes the process to end, but the command processor does not get control
    // TODO - and therefore cannot produce the response format?
    // eslint-disable-next-line jest/no-commented-out-tests
    // it("should invoke the handler and print a message if no options are specified and produce a JSON response", async () => {
    //     const response = runCliScript(__dirname + "/__scripts__/test-handler/test_handler_rfj.sh", TEST_ENVIRONMENT.workingDir);
    //     console.log(response.stdout.toString());
    //     expect(response.status).toBe(0);
    //     expect(response.stderr.toString()).toBe("");

    //     // Verify that we can parse the stdout string into a JSON object
    //     const respObj: ICommandResponse = JSON.parse(response.stdout.toString());

    //     // Check the properties of the object for correctness
    //     expect(respObj.success).toBe(true);
    // });
});
