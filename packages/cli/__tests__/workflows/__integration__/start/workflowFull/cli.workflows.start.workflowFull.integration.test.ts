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

import { ITestEnvironment, runCliScript } from "../../../../../../../__tests__/__packages__/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("Create workflow cli system tests", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "start_workflow_full",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    describe("Start workflow", () => {
        describe("Failure Scenarios", () => {
            it("Should throw error if workflow key is missing.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_key_full.sh", TEST_ENVIRONMENT);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("workflow-key");
            });

            it("Should throw error if workflow name is missing.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_name_full.sh", TEST_ENVIRONMENT);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("workflow-name");
            });

            it("Should throw error if workflow key option or workflow name option is not specified.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_empty.sh", TEST_ENVIRONMENT);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("You must specify one of these option");
            });

            it("Should throw error if both workflow key option and workflow name option are specified.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_both.sh", TEST_ENVIRONMENT);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("The following options conflict");
            });
        });
        describe("Display Help", () => {
            it("should display start workflow-full help", async () => {
                const response = runCliScript(__dirname + "/__scripts__/start_workflow_full_help.sh", TEST_ENVIRONMENT);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
            });
        });
    });
});
