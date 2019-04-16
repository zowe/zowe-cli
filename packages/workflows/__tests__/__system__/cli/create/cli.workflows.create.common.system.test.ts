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

import { ZosmfRestClient } from "../../../../../rest";
import { Session } from "@brightside/imperative";
import { getUniqueDatasetName, runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { DeleteWorkflow } from "../../../..";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { Upload } from "../../../../../zosfiles/src/api/methods/upload";
import { Create, CreateDataSetTypeEnum } from "../../../../../zosfiles/src/api/methods/create";
import { ZosFilesConstants } from "../../../../../zosfiles/src/api";
import { join } from "path";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let definitionDs: string;
let fakeDefFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;
const workflow = join(__dirname, "../../testfiles/demo.xml");
const workflowDs = join(__dirname, "../../testfiles/demods.xml");

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

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Create workflow using uss file", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUSSFile(REAL_SESSION, workflow, definitionFile, true);
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
        describe("Success Scenarios", () => {
            afterEach(async () => {
                let error;
                const response: any = await ZosmfRestClient.getExpectJSON(REAL_SESSION, "/zosmf/workflow/rest/1.0/workflows?workflowName=" + wfName);
                response.workflows.forEach(async (element: any) => {
                    if (element.workflowName === wfName) {
                        wfKey = element.workflowKey;
                        try {
                            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
                        } catch (err) {
                            error = err;
                        }
                    }
                });
            });
            it("Should create workflow in zOSMF.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
            it("Should throw error if workflow with the same name already exists", async () => {
                const createWf = await runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("already exists.");
            });
            it("Should not throw error if workflow with the same name already exists and there is overwrite", async () => {
                const createWf = await runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, definitionFile, system, owner, "--overwrite"]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
        });
        describe("Failure Scenarios", () => {
            it("Should throw error if the uss file does not exist", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_uss.sh",
                    testEnvironment, [wfName, fakeDefFile, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("was either not found or cannot be accessed");
            });
        });
    });
    describe("Create workflow using dataset", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            let error;
            let response;

            try {
                response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, definitionDs,
                    {recfm: "VB", lrecl: 512, blksize: 32760});
            } catch (err) {
                error = err;
            }
            await Upload.fileToDataset(REAL_SESSION, workflowDs, definitionDs);

        });
        afterAll(async () => {
            let error;
            let response;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES;
            // deleting uploaded workflow file
            try {
                const wfEndpoint = endpoint + "/" + definitionDs;
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, wfEndpoint);
            } catch (err) {
                error = err;
            }
        });
        describe("Success Scenarios", () => {
            afterEach(async () => {
                let error;
                const response: any = await ZosmfRestClient.getExpectJSON(REAL_SESSION, "/zosmf/workflow/rest/1.0/workflows?workflowName=" + wfName);
                response.workflows.forEach(async (element: any) => {
                    if (element.workflowName === wfName) {
                        wfKey = element.workflowKey;
                        try {
                            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
                        } catch (err) {
                            error = err;
                        }
                    }
                });
            });
            it("Should create workflow in zOSMF.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
            it("Should throw error if workflow with the same name already exists", async () => {
                const createWf = await runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("already exists.");
            });
            it("Should not throw error if workflow with the same name already exists and there is overwrite", async () => {
                const createWf = await runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner]);
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, definitionDs, system, owner, "--overwrite"]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("workflowKey");
            });
        });
        describe("Failure Scenarios", () => {
            it("Should throw error if the dataset does not exist", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_create_workflow_ds.sh",
                    testEnvironment, [wfName, fakeDefFile, system, owner]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("was either not found or cannot be accessed");
            });
        });
    });
});
