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

import { ICommandResponse } from "@brightside/imperative";
import { ITestEnvironment } from "./../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "./../../../../../../__tests__/__src__/TestUtils";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("zos-console issue command", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_console_issue_command"
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });


    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should detect if the mutually exclusive options are specified", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_mutual.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should detect if the mutually exclusive options are specified and return valid JSON", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_mutual_rfj.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);

        // Convert response to an object and check fields
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());
        expect(respObj.success).toBe(false);
        expect(respObj.message).toBe("Command syntax invalid");
        expect(respObj.stdout).toBe("");
        expect(respObj.stderr).toMatchSnapshot();
        expect(respObj.data).toBeDefined();
    });

    it("should not accept wrong characters in the console name", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_console_wrong_.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toBe("");
    });

});
