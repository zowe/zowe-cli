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

import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";


let TEST_ENVIRONMENT: ITestEnvironment;

describe("Create workflow with uss file integration test", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "list_active_workflow_details"
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    it("Should throw error if a positional parameter is empty string.", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss_empty.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("Missing Positional Argument");
    });

    it("should display create workflow-from-uss-file help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/create_workflow_uss_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
