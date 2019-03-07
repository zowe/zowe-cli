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

describe("Delete active workflow integration test", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "list_active_workflow_details"
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    it("Should throw error if workflowKey is empty string.", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_key.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("No value specified for option");
    });

    it("should display delete workflow-key help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/delete_active_workflow_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
