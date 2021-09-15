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

describe("Delete archived workflow integration test", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "list_archived_workflow_details",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    it("Should throw error if no option is chosen.", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_key.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("You must specify one of these options");
    });

    it("Should throw error if both options are chosen chosen.", async () => {
        const wfKey = "fake-key";
        const wfName = "fake-name";
        const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_conflict.sh",
            TEST_ENVIRONMENT, [wfKey, wfName]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("The following options conflict");
    });

    it("Should throw error if wfKey is empty.", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_missing_key.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("No value specified for option");
    });

    it("Should throw error if wfName is empty.", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_missing_name.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("No value specified for option:");
    });

    it("should display delete workflow help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/delete_archived_workflow_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
