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
import { ITestEnvironment, runCliScript } from "../../../../../../../__tests__/__packages__/ts-cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("List Active Workflow Details", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "list_active_workflow_details",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "list_workflow_details_help.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("Should throw error if the parameter workflow-key is empty string.", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "list_active_workflow_details_no_wk.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, []);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("No value specified for option");
    });

    it("Should throw error if the parameter workflow-name is empty string.", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "list_active_workflow_details_no_wn.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, []);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("No value specified for option");
    });

    it("Should throw error no option is specified.", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "list_active_workflow_details_no_option.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("You must specify one of these options");
    });

    it("Should throw error both options is specified.", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "list_active_workflow_details_conflict.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["fakeKey", "fakeName"]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("The following options conflict");
    });

    it("Should throw error skip-workflow-summary is used without other options.", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "list_active_workflow_details_sws.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["fakeKey"]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("You must also specify at least one of the following:");
    });

    it("Should throw error list-steps and step-summary-only are used together.", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "list_active_workflow_details_ls_and_sso.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["fakeKey"]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("The following options conflict");
    });
});
