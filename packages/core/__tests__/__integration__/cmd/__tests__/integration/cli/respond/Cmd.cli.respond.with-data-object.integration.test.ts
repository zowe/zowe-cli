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

describe("cmd-cli respond with-data-object", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_root_respond_with_data_object"
        });
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/with-data-object/respond_with_data_object_help.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should display a syntax error if no parms are specified", async () => {
        const response = runCliScript(__dirname + "/__scripts__/with-data-object/respond_with_data_object_no_parms.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toBe("");
        expect(response.stderr.toString()).toMatchSnapshot();
    });

    it("should display a syntax error if the JSON object passed is not valid", async () => {
        const response = runCliScript(__dirname + "/__scripts__/with-data-object/respond_with_data_object_invalid_json.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toBe("");
        const regex = /(Unexpected token i in JSON at position 0)|(Unexpected token 'i', "invalid json!" is not valid JSON)/;
        expect(response.stderr.toString()).toMatch(regex);
    });

    it("should allow us to formulate a response object with a data object and produce JSON", async () => {
        const response = runCliScript(__dirname + "/__scripts__/with-data-object/respond_with_data_object_rfj.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");

        // Ensure we can parse the output object to JSON
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());

        // Ensure the properties are correct
        expect(respObj.success).toBe(true);
        expect(respObj.message).toBe("this should succeed");
        expect(respObj.stdout).toMatchSnapshot();
        expect(respObj.stderr).toBe("");
        expect(respObj.data).toMatchSnapshot();
    });
});
