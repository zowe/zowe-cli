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

import { DefinitionWorkflow } from "../../../src";
import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { noWorkflowDefinitionFile } from "../../../src/WorkflowConstants";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { inspect } from "util";
import { getUniqueDatasetName } from "../../../../../__tests__/__src__/TestUtils";
import { IWorkflowDefinition } from "../../../src/doc/IWorkflowDefinition";
import { Upload, ZosFilesConstants } from "@zowe/zos-files-for-zowe-sdk";
import { ZosmfRestClient, nozOSMFVersion, noSession } from "@zowe/core-for-zowe-sdk";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let system: string;
let owner: string;
let wfName: string;

const workflow = __dirname + "/../testfiles/demo.xml";
const wfVersion = "1.0";
const propertiesSteps = false;
const propertiesVariables = false;

function expectZosmfResponseSucceeded(response: IWorkflowDefinition, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IWorkflowDefinition, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("Properties workflow", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "properties_workflow"
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
        it("Successful call without optional parameters returns definition response", async () => {
            let error;
            let response: IWorkflowDefinition;

            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, wfVersion,
                    definitionFile, propertiesSteps, propertiesVariables);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowDescription).toContain("Greeting workflow");

        });
        it("Successful call with steps parameter returns IWorkflowDefinition definition response.", async () => {
            let error;
            let response: IWorkflowDefinition;

            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, wfVersion, definitionFile, true, propertiesVariables);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowDescription).toContain("Greeting workflow");
            expect(response.steps[0].name).toContain("echo");

        });
        it("Successful call with variables returns IWorkflowDefinition definition response.", async () => {
            let error;
            let response: IWorkflowDefinition;

            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, wfVersion, definitionFile, propertiesSteps, true);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowDescription).toContain("Greeting workflow");
            expect(response.variables[0].name).toContain("GREETING");

        });
        it("Successful call with all optional parameters returns IWorkflowDefinition definition response.", async () => {
            let error;
            let response: IWorkflowDefinition;

            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, wfVersion, definitionFile, true, true);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowDescription).toContain("Greeting workflow");
            expect(response.steps[0].name).toContain("echo");
            expect(response.variables[0].name).toContain("GREETING");

        });
        it("Successful call with undefined optional parameters returns IWorkflowDefinition definition response.", async () => {
            let error;
            let response: IWorkflowDefinition;

            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, wfVersion, definitionFile, undefined, undefined);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowDescription).toContain("Greeting workflow");

        });
        it("Successful call with null optional parameters returns IWorkflowDefinition definition response.", async () => {
            let error;
            let response: IWorkflowDefinition;

            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, wfVersion, definitionFile, null, null);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowDescription).toContain("Greeting workflow");

        });
        it("Successful call with undefined zosmf verison (used default) returns definition response.", async () => {
            let error;
            let response: IWorkflowDefinition;

            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, undefined, definitionFile,
                    propertiesSteps, propertiesVariables);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowDescription).toContain("Greeting workflow");

        });
    });
    describe("Fail scenarios", () => {
        beforeAll(async () => {
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
        it("Throws an error with undefined session.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(undefined, wfVersion, definitionFile, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSession.message);
        });
        it("Throws an error with undefined workflow definition file.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, wfVersion, undefined, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowDefinitionFile.message);
        });
        it("Throws an error with workflow definition file as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, wfVersion, "", propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowDefinitionFile.message);
        });
        it("Throws an error with zOSMF version as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(REAL_SESSION, "", definitionFile, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });
    });
});
