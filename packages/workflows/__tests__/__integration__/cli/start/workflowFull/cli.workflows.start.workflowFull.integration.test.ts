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

import * as path from "path";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("Create workflow cli system tests", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "start_workflow_full"
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    describe("Start workflow", () => {
        describe("Failure Scenarios", () => {
            it("Should throw error if workflow key is missing.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_full.sh", TEST_ENVIRONMENT);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("workflow-key");
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
