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
import { getUniqueDatasetName, runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { CreateWorkflow, PropertiesWorkflow } from "../../../..";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { Upload } from "../../../../../zosfiles/src/api/methods/upload";
import { ZosFilesConstants } from "../../../../../zosfiles/src/api";
import { join } from "path";
import { startT } from "../../../../src/api/doc/IStartWorkflow";
import { IWorkflowInfo } from "../../../../src/api/doc/IWorkflowInfo";
import { WorkflowConstants } from "../../../../src/api/WorkflowConstants";
import { IStepInfo } from "../../../../src/api/doc/IStepInfo";

const resolveConflict: startT = "outputFileValue";
const stepName = "echo";
const performFollowingSteps = false;

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;
const workflow = join(__dirname, "../../testfiles/demo.xml");

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
        definitionFile = `${defaultSystem.unix.testdir}/${getUniqueDatasetName(owner)}.xml`;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Start workflow", () => {
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
                let response: IWorkflowInfo;
                let flag = false;
                while (!flag) {
                    response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, wfKey, WorkflowConstants.ZOSMF_VERSION, true);
                    response.steps.forEach((step: IStepInfo) => {
                        if (step.state === "Complete" && response.statusName !== "automation-in-progress") {
                            flag = true;
                        }
                    });
                    if (response.automationStatus && response.statusName !== "automation-in-progress") {
                        flag = true;
                    }
                }
            });
            beforeAll(async () => {
                const response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
                wfKey = response.workflowKey;
            });
            it("Should start full workflow using wf key in zOSMF.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_key_full.sh",
                    testEnvironment, [wfKey, resolveConflict]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow");
            });
            it("Should start full workflow using wf Name in zOSMF.", async () => {
                const response = await runCliScript(__dirname + "/__scripts__/command/command_start_workflow_name_full.sh",
                    testEnvironment, [wfName, resolveConflict]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow");
            });
            it("Should start one workflow using wf Key and step.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_key_step.sh",
                    testEnvironment, [stepName, wfKey, resolveConflict]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow step started.");
            });
            it("Should start one workflow using wf Name and step.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_name_step.sh",
                    testEnvironment, [stepName, wfName, resolveConflict]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow step started.");
            });
            it("Should start one workflow step using wf Key.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_key_step_plus_following.sh",
                    testEnvironment, [stepName, wfKey, resolveConflict, "--perform-following-steps"]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow step started.");
            });
            it("Should start one workflow step using wf Name.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_name_step_plus_following.sh",
                    testEnvironment, [stepName, wfName, resolveConflict, "--perform-following-steps"]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow step started.");
            });
        });
    });
});
