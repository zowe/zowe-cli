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

import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../src/TestUtil";
import { ICommandResponse } from "../../../../../../../src/cmd";
import * as fs from "fs";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("cmd-cli invoke unexpected-exception-handler", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_test_unexpected_exception_handler"
        });
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/__scripts__/unexpected-exception-handler/unexpected_exception_handler_help.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail because of an unexpected exception", () => {
        const response = runCliScript(__dirname + "/__scripts__/unexpected-exception-handler/unexpected_exception_handler.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toBe("");

        // Ensure that the stderr field matches the expected regex - some non-deterministic data is contained within
        const regex = fs.readFileSync(__dirname + "/__regex__/unexpected-exception-handler/unexpected-exception-handler.regex").toString();
        expect(new RegExp(regex, "g").test(response.stderr.toString())).toBe(true);
    });

    it("should fail because of an unexpected exception and produce a JSON response", () => {
        const response = runCliScript(__dirname + "/__scripts__/unexpected-exception-handler/unexpected_exception_handler_rfj.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toBe("");

        // Convert the resposne to a JSON object
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());

        // Ensure that the fields are correct
        expect(respObj.message).toMatch(
            /Unexpected Command Error: Cannot read (property 'split' of undefined|properties of undefined \(reading 'split'\))/
        );
        expect(respObj.success).toBe(false);
        expect(respObj.error.msg).toMatch(
            /Cannot read (property 'split' of undefined|properties of undefined \(reading 'split'\))/
        );
        expect(respObj.error.stack).toContain("TypeError: Cannot read");

        // Ensure that the stderr field matches the expected regex - some non-deterministic data is contained within
        const regex = fs.readFileSync(__dirname + "/__regex__/unexpected-exception-handler/unexpected-exception-handler.regex").toString();
        expect(new RegExp(regex, "g").test(respObj.stderr.toString())).toBe(true);
    });
});
