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

import { Session } from "@zowe/core-for-zowe-sdk";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { CreateWorkflow, DeleteWorkflow, IWorkflows, ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";
import { Delete, Upload } from "@zowe/zos-files-for-zowe-sdk";
import { join } from "path";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let system: string;
let owner: string;
let wfName: string;
const workflow = join(__dirname, "../../../../../../workflows/__tests__/__system__/testfiles/demo.xml");

describe("List workflow cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "list_workflow_cli"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
        definitionFile = `${defaultSystem.unix.testdir}/${getUniqueDatasetName(owner)}.xml`;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("List all workflows", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUssFile(REAL_SESSION, workflow, definitionFile, { binary: true });

            // Create a workflow to list
            await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
        });
        afterAll(async () => {
            // deleting uploaded workflow file
            await Delete.ussFile(REAL_SESSION, definitionFile);

            const response = await ListWorkflows.getWorkflows(REAL_SESSION, { owner }) as IWorkflows;
            for (const element of response.workflows) {
                if (element.workflowName === wfName) {
                    await DeleteWorkflow.deleteWorkflow(REAL_SESSION, element.workflowKey as string);
                }
            }
        });
        describe("Success Scenarios", () => {
            it("Should return list of workflows in zOSMF.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_list_workflow.sh",
                    testEnvironment, [wfName]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain(`${wfName}`);
            });
            it("Should return a message if search does not match any existing workflows", async () => {
                const fakeName = `${wfName}${wfName}${wfName}`;
                const response = await runCliScript(__dirname + "/__scripts__/command/command_list_workflow.sh",
                    testEnvironment, [fakeName]);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("No workflows match the requested querry");
            });
        });
    });
});
