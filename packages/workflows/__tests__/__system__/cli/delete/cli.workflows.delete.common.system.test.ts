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
import { Session } from "@zowe/imperative";
import { runCliScript, getUniqueDatasetName } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { CreateWorkflow } from "../../../..";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { Upload } from "../../../../../zosfiles/src/api/methods/upload";
import { ZosFilesConstants } from "../../../../../zosfiles/src/api";
import { join } from "path";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let definitionFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;
const fakewfkey: string = "FAKEKEY";
const fakeName: string = "FAKENAME";

const workflow = join(__dirname, "../../testfiles/demo.xml");

describe("Delete workflow cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "delete_workflow_cli"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();
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
        beforeEach(async () =>{
            const response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
            wfKey = response.workflowKey;
        });
        it("Should delete workflow in zOSMF.", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_key.sh",
            testEnvironment, [wfKey]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Workflow deleted");
        });

        it("Should delete workflow in zOSMF.", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_workflow_name.sh",
            testEnvironment, [wfName]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Workflow deleted");
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
