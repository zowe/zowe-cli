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

import { ITestEnvironment } from "../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../__src__/environment/SetupTestEnvironment";
import * as TestUtils from "../../../src/TestUtil";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("Hello World", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_test_unexpected_exception_handler"
        });
    });

    it ("should print world from the hello command", async () => {
        const response = await TestUtils.runCliScript(__dirname + "/scripts/hello.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it ("should print help if the option is specified", async () => {
        const response = await TestUtils.runCliScript(__dirname + "/scripts/help.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it ("should print version if the option is specified", async () => {
        const response = await TestUtils.runCliScript(__dirname + "/scripts/version.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
