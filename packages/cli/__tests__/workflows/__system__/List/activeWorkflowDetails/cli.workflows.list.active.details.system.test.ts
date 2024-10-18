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

import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { Session } from "@zowe/imperative";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName, wait, waitTime } from "../../../../../../../__tests__/__src__/TestUtils";
import { CreateWorkflow, DeleteWorkflow } from "@zowe/zos-workflows-for-zowe-sdk";
import { Upload } from "@zowe/zos-files-for-zowe-sdk";
import { join } from "path";
import { runCliScript } from "@zowe/cli-test-utils";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let fakeDefFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;
const workflow = join(__dirname, "../../../../../../workflows/__tests__/__system__/testfiles/demo.xml");

describe("List active workflow details cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "create_workflow_cli"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
        definitionFile = `${defaultSystem.unix.testdir}/${getUniqueDatasetName(owner).toLowerCase()}.xml`;
        fakeDefFile = definitionFile + "fakefile";

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        await wait(waitTime); //wait 2 seconds
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Create workflow using uss file", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUssFile(REAL_SESSION, workflow, definitionFile, { binary: true });
            await wait(waitTime); //wait 2 seconds
            testEnvironment.resources.files.push(definitionFile);

            // Create a workflow instance in zOS/MF to list
            const response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
            await wait(waitTime); //wait 2 seconds
            wfKey = response.workflowKey;
        });
        afterAll(async () => {
            // deleting wf instance
            const response: any = await ZosmfRestClient.getExpectJSON(REAL_SESSION, "/zosmf/workflow/rest/1.0/workflows?workflowName=" + wfName);
            for (const element of response.workflows) {
                if (element.workflowName === wfName) {
                    try {
                        await DeleteWorkflow.deleteWorkflow(REAL_SESSION, element.workflowKey);
                    } catch { /* Do nothing */ }
                }
            }
        });
        describe("Success Scenarios", () => {
            it("Should list active workflow details using wf key.", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/list_active_workflow_key_details.sh",
                    testEnvironment, [wfKey]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow Details");
            });

            it("Should list active workflow details using wf name.", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/list_active_workflow_name_details.sh",
                    testEnvironment, [wfName]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow Details");
            });
        });
        describe("Failure Scenarios", () => {
            it("Should throw error if the workflow does not exist", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/list_active_workflow_key_details.sh",
                    testEnvironment, [fakeDefFile]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("does not exist.");
            });

            it("Should throw error if the workflow name does not exist", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/list_active_workflow_name_details.sh",
                    testEnvironment, [fakeDefFile]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("No workflows match the provided workflow name.");
            });
        });
    });
});
