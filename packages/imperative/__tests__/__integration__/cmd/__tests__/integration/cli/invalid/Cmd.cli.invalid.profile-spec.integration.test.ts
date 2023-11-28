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

describe("cmd-cli invalid profile-spec", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_invalid_profile_spec"
        });
    });

    it("should fail the command if the profile property is not supplied and the handler requests a profile", () => {
        const response = runCliScript(__dirname + "/__scripts__/profile-spec.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toBe('');
        expect(response.stderr.toString()).toContain('Internal Error: No profiles of type "blah" were loaded for this command.');
        expect(response.stderr.toString()).toContain('This error can occur for one of two reasons:');
        expect(response.stderr.toString()).toContain('- The "profile" property on the command definition document ' +
            'does NOT specify the requested profile type');
        expect(response.stderr.toString()).toContain('- The profile type is marked "optional", ' +
            'no profiles of type "blah" have been created, ' +
            'and the command handler requested a profile of type "blah" with "failNotFound=true"');
    });
});
