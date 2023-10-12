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

describe("cmd-cli auto-format table", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_HOME",
            testName: "cmd_cli_auto_format_table"
        });
    });

    it ("should include the header if no option is specified because it is defaulted in the handler", async () => {
        const response = runCliScript(__dirname + "/__scripts__/table/no_options.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("name");
        expect(response.stdout.toString()).toContain("details");
    });

    it ("should include the header if the user specifies rfh", async () => {
        const response = runCliScript(__dirname + "/__scripts__/table/include_header.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("name");
        expect(response.stdout.toString()).toContain("details");
    });

    it ("should NOT include the header if the user specifies rfh=false", async () => {
        const response = runCliScript(__dirname + "/__scripts__/table/set_header_false.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).not.toContain("name");
        expect(response.stdout.toString()).not.toContain("details");
    });

    it ("should allow extraction of properties within each entry of an array", async () => {
        const response = runCliScript(__dirname + "/__scripts__/table/extract_nested_table.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
