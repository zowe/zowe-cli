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
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { ArchivedDeleteWorkflow, CreateWorkflow, ArchiveWorkflow, IWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";
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
const fakeName: string = "FAKENAME";
const workflow = join(__dirname, "../../../../../../workflows/__tests__/__system__/testfiles/demo.xml");

describe("List archived workflow cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "list_workflow_cli"
        });
        //   systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = testEnvironment.systemTestProperties;
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
        definitionFile = `${defaultSystem.unix.testdir}/${getUniqueDatasetName(owner)}.xml`;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
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
        const URI = "/zosmf/workflow/rest/1.0/archivedworkflows?workflowName=" + wfName;
        response =  await ZosmfRestClient.getExpectJSON<IWorkflows>(REAL_SESSION, URI);
        response.workflows.forEach(async (element: any) => {
            if(element.workflowName===wfName){
                wfKey = element.workflowKey;
                try {
                    await ArchivedDeleteWorkflow.archivedDeleteWorkflow(REAL_SESSION, wfKey);
                } catch (err) {
                    error = err;
                }
            }
        });
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
        beforeEach(async () =>{
            const response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
            wfKey = response.workflowKey;
            // Archive workflow
            await ArchiveWorkflow.archiveWorkflowByKey(REAL_SESSION, wfKey);
        });
        afterEach(async () => {
            // deleting archived workflow
            await ArchivedDeleteWorkflow.archivedDeleteWorkflow(REAL_SESSION, wfKey);
        });
        it("Should list workflows in zOSMF.", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_list_workflow.sh",
                testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(wfKey);
        });
    });
});
