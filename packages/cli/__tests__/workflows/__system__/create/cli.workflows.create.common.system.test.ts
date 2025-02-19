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
import { runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../__tests__/__src__/TestUtils";
import { DeleteWorkflow } from "@zowe/zos-workflows-for-zowe-sdk";
import { Upload, Create, CreateDataSetTypeEnum } from "@zowe/zos-files-for-zowe-sdk";
import { join } from "path";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/ITestEnvironment";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let definitionDs: string;
let fakeDefFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;
let fakeLocalFile: string;
const workflow = join(__dirname, "../../../../../workflows/__tests__/__system__/testfiles/demo.xml");
const workflowDs = join(__dirname, "../../../../../workflows/__tests__/__system__/testfiles/demods.xml");

describe("Create workflow cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "create_workflow_cli"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
        definitionDs = `${getUniqueDatasetName("PUBLIC")}`;
        definitionFile = `${defaultSystem.unix.testdir}/${getUniqueDatasetName(owner)}.xml`;
        fakeDefFile = definitionFile + "FAKEFILE";
        fakeLocalFile = "qwerty.xml";
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Create workflow using uss file", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUssFile(REAL_SESSION, workflow, definitionFile, { binary: true });
            testEnvironment.resources.files.push(definitionFile);
        });
        describe("Success Scenarios", () => {
            afterEach(async () => {
                const response: any = await ZosmfRestClient.getExpectJSON(REAL_SESSION, "/zosmf/workflow/rest/1.0/workflows?workflowName=" + wfName);
                for (const element of response.workflows) {
                    if (element.workflowName === wfName) {
                        wfKey = element.workflowKey;
                        try {
                            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
                        } catch (err) {
                            // Do nothing
                        }
                    }
                }
            });
            it("Should create workflow in zOSMF.", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
            it("Should throw error if workflow with the same name already exists", () => {
                runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("already exists.");
            });
            it("Should not throw error if workflow with the same name already exists and there is overwrite", () => {
                runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner, "--overwrite"]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
        });
        describe("Failure Scenarios", () => {
            it("Should throw error if the uss file does not exist", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, fakeDefFile, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("was either not found or cannot be accessed");
            });
        });
    });
    describe("Create workflow using local file", () => {
        describe("Success Scenarios", () => {
            afterEach(async () =>{
                const response: any = await ZosmfRestClient.getExpectJSON(REAL_SESSION, "/zosmf/workflow/rest/1.0/workflows?workflowName=" + wfName);
                let deleteWorkflow: any;
                for (deleteWorkflow of response.workflows) {
                    if(deleteWorkflow.workflowName===wfName){
                        wfKey = deleteWorkflow.workflowKey;
                        try {
                            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
                        } catch (err) {
                            // Do nothing
                        }
                    }
                }
            });
            it("Should create workflow in zOSMF.", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_local_file.sh",
                    testEnvironment, [wfName, workflow, system, owner]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
            it("Should throw error if workflow with the same name already exists", () => {
                runCliScript(__dirname + "/__scripts__/command/command_create_workflow_local_file.sh",
                    testEnvironment, [wfName, workflow, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_local_file.sh",
                    testEnvironment, [wfName, workflow, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("already exists.");
            });
            it("Should not throw error if workflow with the same name already exists and there is overwrite", () => {
                runCliScript(__dirname + "/__scripts__/command/command_create_workflow_local_file.sh",
                    testEnvironment, [wfName, workflow, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_local_file.sh",
                    testEnvironment, [wfName, workflow, system, owner, "--overwrite"]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
        });
        describe("Failure Scenarios", () => {
            it("Should throw error if the local file does not exist", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_local_file.sh",
                    testEnvironment, [wfName, fakeLocalFile, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("no such file or directory");
            });
        });
    });
    describe("Create workflow using dataset", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios

            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, definitionDs,
                    {recfm: "VB", lrecl: 512, blksize: 32760});
            } catch (err) {
                // Do nothing
            }
            await Upload.fileToDataset(REAL_SESSION, workflowDs, definitionDs);
            testEnvironment.resources.datasets.push(definitionDs);
        });
        describe("Success Scenarios", () => {
            afterEach(async () => {
                const response: any = await ZosmfRestClient.getExpectJSON(REAL_SESSION, "/zosmf/workflow/rest/1.0/workflows?workflowName=" + wfName);
                for (const element of response.workflows) {
                    if (element.workflowName === wfName) {
                        wfKey = element.workflowKey;
                        try {
                            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
                        } catch (err) {
                            // Do nothing
                        }
                    }
                }
            });
            it("Should create workflow in zOSMF.", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
            it("Should throw error if workflow with the same name already exists", () => {
                runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("already exists.");
            });
            it("Should not throw error if workflow with the same name already exists and there is overwrite", () => {
                runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner, "--overwrite"]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
        });
        describe("Failure Scenarios", () => {
            it("Should throw error if the dataset does not exist", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, fakeDefFile, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("was either not found or cannot be accessed");
            });
        });
    });
});
