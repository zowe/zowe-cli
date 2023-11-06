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

import { join } from "path";
import { runCliScript } from "../../../../../../__resources__/src/TestUtil";
import { ITestEnvironment } from "../../../../../../__resources__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__resources__/__src__/environment/SetupTestEnvironment";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli test config-auto-store command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_auto_store_command"
        });
    });

    it("should store the password automatically", async () => {
        const testPwd = "The greatest password of all time";
        let res = runCliScript(join(__dirname, "../config/init/__scripts__/init_config.sh"), TEST_ENVIRONMENT.workingDir, ["--prompt false"]);
        expect(res.stderr.toString()).toBe("");
        expect(res.status).toBe(0);

        res = runCliScript(__dirname + "/__scripts__/test_config_auto_store.sh", TEST_ENVIRONMENT.workingDir, [testPwd]);
        expect(res.stderr.toString()).toBe("");
        expect(res.status).toBe(0);
        expect(res.stdout.toString()).toContain("(will be hidden)");
        expect(res.stdout.toString()).toContain(testPwd);

        res = runCliScript(__dirname + "/__scripts__/test_config_auto_store.sh", TEST_ENVIRONMENT.workingDir);
        expect(res.stderr.toString()).toBe("");
        expect(res.status).toBe(0);
        expect(res.stdout.toString()).toContain(testPwd);
    });
});
