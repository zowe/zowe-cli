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

import { runCliScript } from "../../../../../../src/TestUtil";
import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
describe("cmd-cli profiles create banana", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_profiles_create_banana"
        });
    });

    it("should create profiles and only list the type requested", () => {

        // Create a few profiles of multiple types
        const response = runCliScript(__dirname + "/__scripts__/profiles/create_some_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toContain("command 'profiles create' is deprecated");
        expect(response.stdout.toString()).toContain("test_banana");
        expect(response.stdout.toString()).toContain("test_strawberry");
        expect(response.stdout.toString()).toContain("test_kiwi");
        expect(response.stdout.toString()).not.toContain("Overwrote existing profile");

        // List the profiles for banana
        const listBananaResponse = runCliScript(__dirname + "/__scripts__/profiles/list_profiles_of_type.sh", TEST_ENVIRONMENT.workingDir,
            ["banana"]);
        expect(listBananaResponse.status).toBe(0);
        expect(listBananaResponse.stderr.toString()).toContain("command 'profiles list' is deprecated");
        expect(listBananaResponse.stdout.toString()).not.toContain("strawberry");
        expect(listBananaResponse.stdout.toString()).toMatchSnapshot();

        // List the profiles for strawberry
        const listStrawberryResponse = runCliScript(__dirname + "/__scripts__/profiles/list_profiles_of_type.sh", TEST_ENVIRONMENT.workingDir,
            ["strawberry"]);
        expect(listStrawberryResponse.status).toBe(0);
        expect(listStrawberryResponse.stderr.toString()).toContain("command 'profiles list' is deprecated");
        expect(listStrawberryResponse.stdout.toString()).toMatchSnapshot();
        expect((listStrawberryResponse.stdout.toString().match(/default/g) || []).length).toBe(1);

        // List the profiles for kiwi
        const listKiwiResponse = runCliScript(__dirname + "/__scripts__/profiles/list_profiles_of_type.sh", TEST_ENVIRONMENT.workingDir, ["kiwi"]);
        expect(listKiwiResponse.status).toBe(0);
        expect(listKiwiResponse.stderr.toString()).toContain("command 'profiles list' is deprecated");
        expect(listKiwiResponse.stdout.toString()).not.toContain("kiwiSecret");
        expect(listKiwiResponse.stdout.toString()).toMatchSnapshot();
    });
});
