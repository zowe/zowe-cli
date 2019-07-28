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

describe("List Workflow Definition FIle Details", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "list_workflow_definition_file_details",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "list_workflow_definition_help.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("Should throw error if positional argumnent is missing.", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "list_workflow_definition_missing_argument.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, [null]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("Missing Positional Argument:");
    });
});
