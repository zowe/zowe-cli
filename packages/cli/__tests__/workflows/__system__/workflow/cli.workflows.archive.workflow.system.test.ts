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

import { Session } from "@zowe/imperative";
import { getUniqueDatasetName, runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import {
    ArchivedDeleteWorkflow,
    CreateWorkflow,
    IWorkflows,
    ListArchivedWorkflows,
    ListWorkflows
} from "@zowe/zos-workflows-for-zowe-sdk";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { Delete, Upload } from "@zowe/zos-files-for-zowe-sdk";
import { join } from "path";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let system: string;
let owner: string;
let wfName: string;
const workflow = join(__dirname, "../../../../../workflows/__tests__/__system__/testfiles/demo.xml");

describe("Archive workflow cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "archive_workflow_cli"
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
    describe("Archive workflows", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUSSFile(REAL_SESSION, workflow, definitionFile, true);
        });
        afterAll(async () => {
            // deleting uploaded workflow file
            await Delete.ussFile(REAL_SESSION, definitionFile);
        });
        describe("Success Scenarios", () => {
            beforeEach(async () => {
                // Create a workflow to list
                await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
            });
            afterEach(async () => {
                const response: any = await ListArchivedWorkflows.listArchivedWorkflows(REAL_SESSION);
                for (const element of response.archivedWorkflows) {
                    if (element.workflowName === wfName || element.workflowName === `${wfName}2`) {
                        await ArchivedDeleteWorkflow.archivedDeleteWorkflow(REAL_SESSION, element.workflowKey);
                    }
                }
            });
            it("Should return wf key if wf was archived using wf key.", async () => {
                let thisWorkflowKey;
                const actualWfKey = await ListWorkflows.getWorkflows(REAL_SESSION, { workflowName: wfName }) as IWorkflows;
                for (const element of actualWfKey.workflows) {
                    if (element.workflowName === wfName) {
                        thisWorkflowKey = element.workflowKey;
                    }
                }
                const response = runCliScript(__dirname + "/__scripts__/command/command_archive_workflow_key.sh",
                    testEnvironment, [thisWorkflowKey]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain(`${thisWorkflowKey}`);
            });
            it("Should return wf name if wf was archived using wf name.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_archive_workflow_name.sh",
                    testEnvironment, [wfName]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain(`${wfName}`);
            });
            it("should archive multiple workflows using wildcard .*", async () => {
                await CreateWorkflow.createWorkflow(REAL_SESSION, `${wfName}2`, definitionFile, system, owner);
                const response = runCliScript(__dirname + "/__scripts__/command/command_archive_workflow_name.sh",
                    testEnvironment, [`${wfName}.*`]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain(`${wfName}`);
                expect(response.stdout.toString()).toContain(`${wfName}2`);
            });
        });
        describe("Fail Scenarios", () => {
            it("Should return a message if search does not match any existing workflow key", async () => {
                const fakeKey = `${wfName}${wfName}${wfName}`;
                const response = runCliScript(__dirname + "/__scripts__/command/command_archive_workflow_key.sh",
                    testEnvironment, [fakeKey]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain(`The workflow key "${fakeKey}" was not found.`);
            });
            it("Should return a message if search does not match any existing workfow name", async () => {
                const fakeName = `${wfName}${wfName}${wfName}`;
                const response = runCliScript(__dirname + "/__scripts__/command/command_archive_workflow_name.sh",
                    testEnvironment, [fakeName]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("No workflows match the provided workflow name.");
            });
        });
    });
});
