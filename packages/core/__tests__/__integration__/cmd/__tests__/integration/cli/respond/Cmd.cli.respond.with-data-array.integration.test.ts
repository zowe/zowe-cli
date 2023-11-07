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


let TEST_ENVIRONMENT: ITestEnvironment;
const ARRAY_LENGTH: number = 3;

describe("cmd-cli respond with-data-array", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_root_respond_with_data_array"
        });
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/with-data-array/respond_with_data_array_help.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should display a syntax error if no parms are specified", async () => {
        const response = runCliScript(__dirname + "/__scripts__/with-data-array/respond_with_data_array_no_parms.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toBe("");
        expect(response.stderr.toString()).toMatchSnapshot();
    });

    it("should construct a response object with the strings inputted and produce a JSON response", async () => {
        const response = runCliScript(__dirname + "/__scripts__/with-data-array/respond_with_data_array_rfj.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");

        // Ensure we can parse the output to an object
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());

        // Check the expected properties
        expect(respObj.success).toBe(true);
        expect(respObj.stderr).toBe("");
        expect(respObj.stdout).toMatchSnapshot();
        expect(respObj.message).toBe("hello world!");
        expect(respObj.data.length).toBe(ARRAY_LENGTH);
        expect(respObj.data).toMatchSnapshot();
    });
});
