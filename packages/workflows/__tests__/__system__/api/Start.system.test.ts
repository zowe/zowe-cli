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

import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { noWorkflowKey, WorkflowConstants } from "../../../src/WorkflowConstants";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { CreateWorkflow, DeleteWorkflow, PropertiesWorkflow, StartWorkflow } from "../../../src";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { inspect } from "util";
import { getUniqueDatasetName } from "../../../../../__tests__/__src__/TestUtils";
import { IWorkflowInfo } from "../../../src/doc/IWorkflowInfo";
import { IStepInfo } from "../../../src/doc/IStepInfo";
import { Upload, ZosFilesConstants } from "@zowe/zos-files-for-zowe-sdk";
import { ZosmfRestClient, nozOSMFVersion, noSession } from "@zowe/core-for-zowe-sdk";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;

const workflow = __dirname + "/../testfiles/demo.xml";

function expectZosmfResponseSucceeded(response: string, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: string, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("Start workflow", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "create_workflow"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
        definitionFile = `${defaultSystem.unix.testdir.replace(/\/{2,}/g, "/")}/${getUniqueDatasetName(owner)}.xml`;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Success Scenarios", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            let error;
            let response;
            try {
                response = await Upload.fileToUSSFile(REAL_SESSION, workflow, definitionFile, true);
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error upload: " + inspect(error));
            }
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
            let error;
            let response;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error create: " + inspect(error));
            }
            wfKey = response.workflowKey;
        });
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
            // deleting workflow
            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
        });
        it("Should start workflow in zOSMF.", async () => {
            let error;
            let response;

            try {
                response = await StartWorkflow.startWorkflow(REAL_SESSION, wfKey);
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
        });
        it("Should start workflow in zOSMF with all options.", async () => {
            let error;
            let response;

            try {
                response = await StartWorkflow.startWorkflow(REAL_SESSION, wfKey, "outputFileValue", "echo", false);
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error: " + inspect(error));
            }
            // when properties are ready, check if just wan step was run
            expectZosmfResponseSucceeded(response, error);
        });
        it("Should start workflow in zOSMF even if zOSMF version is undefined.", async () => {
            let error;
            let response;

            try {
                response = await StartWorkflow.startWorkflow(REAL_SESSION, wfKey, null, null, null, undefined);
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
        });
    });
    describe("Fail scenarios", () => {
        // wfKey has value from last called CreateWorkflow
        it("should throw an error if the session parameter is undefined", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(undefined, wfKey);
                // Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                // Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSession.message);
        });
        it("should throw an error if the workflowKey parameter is undefined", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(REAL_SESSION, undefined);
                // Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                // Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowKey.message);
        });
        it("Should throw error if workflowKey is empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(REAL_SESSION, "");
                // Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                // Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowKey.message);
        });
        it("Should throw error if zOSMF version is empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(REAL_SESSION, wfKey, null, null, null, "");
                // Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                // Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });
    });
});
