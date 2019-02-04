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

import { runCliScript } from "../../../__src__/TestUtils";
import { ITestEnvironment } from "../../../__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../__src__/environment/TestEnvironment";

// Test environment will be populated in the "beforeAll"
let TEST_ENVIRONMENT: ITestEnvironment;

describe("zowe shell issue command", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "issue_command",
            tempProfileTypes: ["zosmf"]
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should return operating system name", async () => {
        const commandName = "uname";
        const response = await runCliScript(__dirname + "/__scripts__/issue_command_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatch("OS/390");
    });
    it("should resolve --cwd option", async () => {
        const zosmfProperties = TEST_ENVIRONMENT.systemTestProperties.systems.common.zosmf;

        const commandName = "pwd";
        const cwd = "/";
        const response = await runCliScript(__dirname + "/__scripts__/issue_command_with_cwd.sh", TEST_ENVIRONMENT, [commandName, cwd]);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatch(`${cwd}\n`);
    });
});
