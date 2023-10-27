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

import { ITestEnvironment } from "../../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../../src/TestUtil";
import { expectedSchemaObject } from "../__resources__/expectedObjects";


// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config schema", () => {
    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_schema_command"
        });
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--ci"]);
    });
    it("should display the help", () => {
        const response = runCliScript(__dirname + "/../__scripts__/get_help.sh",
            TEST_ENVIRONMENT.workingDir, ["schema"]);
        expect(response.output.toString()).toContain(`Dumps the JSON schema for the config. The schema is dynamically created based on`);
        expect(response.output.toString()).toContain(`your available plugins. Direct the output of this command to a file and include`);
        expect(response.output.toString()).toContain(`in your config with '$schema' property to get editor completion.`);
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should print the generated schema", () => {
        const response = runCliScript(__dirname + "/__scripts__/schema.sh", TEST_ENVIRONMENT.workingDir, [""]);
        expect(JSON.parse(response.stdout.toString())).toEqual(expectedSchemaObject);
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
});
