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


let TEST_ENVIRONMENT: ITestEnvironment;

describe("cmd-cli auto-format cmd-output", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_HOME",
            testName: "cmd_cli_auto_format_cmd_output"
        });
    });

    it ("should use the defaults coded in the handler to output a table with no header", () => {
        const response = runCliScript(__dirname + "/__scripts__/default_output.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it ("should use the defaults coded in the handler to output a table with a header", () => {
        const response = runCliScript(__dirname + "/__scripts__/default_with_header.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it ("should allow the user to format the output as a list", () => {
        const response = runCliScript(__dirname + "/__scripts__/format_list.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it ("should allow the user to format the output as a objects", () => {
        const response = runCliScript(__dirname + "/__scripts__/format_object.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it ("should allow the user to format the output as a string", () => {
        const response = runCliScript(__dirname + "/__scripts__/format_string.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
