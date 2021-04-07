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

// Test Environment populated in the beforeAll();
import { ITestEnvironment, runCliScript } from "../../../../../../../__tests__/__packages__/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import * as fs from "fs";
import { ITestZosmfSchema } from "../../../../../../../__tests__/__src__/properties/ITestZosmfSchema";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;

describe("provisioning list registry_instances", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_list_registry_instances",
            tempProfileTypes: ["zosmf"]
        });
    });

    it("should display registry instances", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/registry_instances_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/registryInstances.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    // Create a separate test environment for no profiles
    describe("without profiles", () => {
        let zOSMF: ITestZosmfSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "provisioning_list_registry_instances_no_profile"
            });
            zOSMF = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf;
        });

        it("should display registry instances", async () => {
            const regex = fs.readFileSync(__dirname + "/__regex__/registry_instances_response.regex").toString();
            const response = runCliScript(__dirname + "/__scripts__/registryInstances_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    zOSMF.host,
                    zOSMF.port,
                    zOSMF.user,
                    zOSMF.password
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
    });
});
