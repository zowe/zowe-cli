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
import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../src/TestUtil";

let TEST_ENVIRONMENT: ITestEnvironment;

describe("cmd-cli", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_validate"
        });
    });

    it("should display proper messages when missing positional parameter", async () => {
        const response = runCliScript( join(__dirname, "__scripts__", "invalid_positional1.sh"), TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    describe("StringOrBlank type option", () => {
        it("should allow user to input blank as input", async () => {
            const response = runCliScript(join(__dirname, "__scripts__", "string_or_blank_option.sh"), TEST_ENVIRONMENT.workingDir, ['""']);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toMatchSnapshot();
        });
        it("should allow user to input valid string as input", async () => {
            const response = runCliScript(join(__dirname, "__scripts__", "string_or_blank_option.sh"), TEST_ENVIRONMENT.workingDir, ["testing"]);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toMatchSnapshot();
        });
        it("should display proper help message when value is missing", async () => {
            const response = runCliScript(join(__dirname, "__scripts__", "string_or_blank_option.sh"), TEST_ENVIRONMENT.workingDir);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });
});
