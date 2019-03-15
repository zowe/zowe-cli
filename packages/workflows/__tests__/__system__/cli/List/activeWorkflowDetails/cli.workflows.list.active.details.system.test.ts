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

import { ZosmfRestClient } from "../../../../../../rest";
import { Session } from "@brightside/imperative";
import { runCliScript, getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { CreateWorkflow, DeleteWorkflow } from "../../../../..";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { Upload } from "../../../../../../zosfiles/src/api/methods/upload";
import { ZosFilesConstants } from "../../../../../../zosfiles/src/api";
import { join } from "path";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let definitionFile: string;
let fakeDefFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;
const workflow = join(__dirname, "../../../testfiles/demo.xml");

describe("List active workflow details cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "create_workflow_cli"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
        definitionFile = `${defaultSystem.unix.testdir}/${getUniqueDatasetName(owner)}.xml`;
        fakeDefFile = definitionFile + "FAKEFILE";

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Create workflow using uss file", () => {
        beforeAll(async () => {
            let error;
            let response;

            // Upload files only for successful scenarios
            try {
            await Upload.fileToUSSFile(REAL_SESSION, workflow, definitionFile, true);
            } catch (err) {
                error = err;
            }

            // Create a workflow instance in zOS/MF to list
            response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
            wfKey = response.workflowKey;
        });
        afterAll(async () => {
            let error;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES;
            // deleting uploaded workflow file
            try {
                const wfEndpoint = endpoint + definitionFile;
                await ZosmfRestClient.deleteExpectString(REAL_SESSION, wfEndpoint);
            } catch (err) {
                error = err;
            }

            // deleting wf instance
            const response: any =  await ZosmfRestClient.getExpectJSON(REAL_SESSION, "/zosmf/workflow/rest/1.0/workflows?workflowName=" + wfName);
            response.workflows.forEach(async (element: any) => {
                if(element.workflowName===wfName){
                    wfKey = element.workflowKey;
                    try {
                        await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
                    } catch (err) {
                        error = err;
                    }
                }
            });
        });
        describe("Success Scenarios", () => {
            it("Should list active workflow details using wf key.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/list_active_workflow_key_details.sh",
                testEnvironment, [wfKey]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow Details");
            });

            it("Should list active workflow details using wf name.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/list_active_workflow_name_details.sh",
                testEnvironment, [wfName]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow Details");
            });
        });
        describe("Failure Scenarios", () => {
            it("Should throw error if the workflow does not exist", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/list_active_workflow_key_details.sh",
                testEnvironment, [ fakeDefFile ]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("does not exist.");
            });

            it("Should throw error if the workflow name does not exist", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/list_active_workflow_name_details.sh",
                testEnvironment, [ fakeDefFile ]);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("No workflows match the provided workflow name.");
            });
        });
    });
});
