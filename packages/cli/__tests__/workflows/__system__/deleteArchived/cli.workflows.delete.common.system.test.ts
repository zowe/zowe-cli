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
import { Session } from "@zowe/core-for-zowe-sdk";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../__tests__/__src__/TestUtils";
import { ArchiveWorkflow, CreateWorkflow } from "@zowe/zos-workflows-for-zowe-sdk";
import { Upload, ZosFilesConstants } from "@zowe/zos-files-for-zowe-sdk";
import { join } from "path";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;
const fakewfkey: string = "FAKEKEY";
const fakeName: string = "FAKENAME";

const workflow = join(__dirname, "../../../../../workflows/__tests__/__system__/testfiles/demo.xml");

describe("Delete workflow cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "delete_workflow_cli"
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
    describe("Success Scenarios", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUssFile(REAL_SESSION, workflow, definitionFile, { binary: true });
        });
        afterAll(async () => {
            let error;
            let response;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES;
            // deleting uploaded workflow file
            try {
                const wfEndpoint = endpoint + definitionFile;
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, wfEndpoint);
            } catch (err) {
                error = err;
            }
        });
        beforeEach(async () => {
            const response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
            wfKey = response.workflowKey;
            // Archive workflow
            await ArchiveWorkflow.archiveWorkflowByKey(REAL_SESSION, wfKey);
        });
        it("Should delete workflow in zOSMF by key.", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_key.sh",
                testEnvironment, [wfKey]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Workflow deleted");
        });

        it("Should delete workflow in zOSMF by name.", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_name.sh",
                testEnvironment, [wfName]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Successfully`);
        });
        it("Should delete workflows in zOSMF using wild card in the name", async () => {
            const secondWf = await CreateWorkflow.createWorkflow(REAL_SESSION, `${wfName}2`, definitionFile, system, owner);
            wfKey = secondWf.workflowKey;
            await ArchiveWorkflow.archiveWorkflowByKey(REAL_SESSION, wfKey);
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_name.sh",
                testEnvironment, [`${wfName}.*`]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Successfully deleted workflow(s):");
            expect(response.stdout.toString()).toContain(`${wfName}`);
            expect(response.stdout.toString()).toContain(`${wfName}2`);
        });
    });
    describe("Failure Scenarios", () => {
        it("Should throw error if no workflow with this wf key was found", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_key.sh",
                testEnvironment, [wfKey + fakewfkey]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("was not found");
        });
        it("Should throw error if no workflow with this wf name was found", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_name.sh",
                testEnvironment, [wfName + fakeName]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("No workflows match the provided workflow name");
        });
    });
});
