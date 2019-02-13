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

import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";

// Test environment will be populated in the "beforeAll"
let TEST_ENVIRONMENT: ITestEnvironment;

// tslint:disable-next-line:no-unused-expression
function checkResponse(response: any) {
    expect(response.stderr.toString()).toBe("");
    expect(response.status).toBe(0);
}

describe("zowe uss issue ssh", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "issue_ssh",
            tempProfileTypes: ["ssh"]
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should return operating system name", async () => {
        const commandName = "uname";
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);

        checkResponse(response);
        expect(response.stdout.toString()).toMatch("OS/390");
    });

    it("should resolve --cwd option", async () => {
        const commandName = "pwd";
        const cwd = "/";
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, cwd]);

        checkResponse(response);
        // match only "/" with no following alpha-numeric character
        expect(response.stdout.toString()).toMatch(new RegExp("\\" + cwd + "\\s"));
    });
});
