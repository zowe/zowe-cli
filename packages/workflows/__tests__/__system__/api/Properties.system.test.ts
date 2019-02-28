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

import { ZosmfRestClient } from "../../../../rest";
import { Session, ImperativeError, Imperative } from "@brightside/imperative";
import { noSession, noWorkflowKey, nozOSMFVersion } from "../../../src/api/WorkflowConstants";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { CreateWorkflow, DeleteWorkflow, PropertiesWorkflow } from "../../..";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { Upload } from "../../../../zosfiles/src/api/methods/upload";
import { ZosFilesConstants } from "../../../../zosfiles/src/api";
import { inspect } from "util";
import { getUniqueDatasetName } from "../../../../../__tests__/__src__/TestUtils";
import { IWorkflowInfo } from "../../../src/api/doc/IWorkflowInfo";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let definitionFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;

const workflow = __dirname + "/../testfiles/demo.xml";
const wfVersion = "1.0";
const propertiesSteps = false;
const propertiesVariables = false;

function expectZosmfResponseSucceeded(response: IWorkflowInfo, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IWorkflowInfo, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("Properties workflow", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            // tempProfileTypes: ["zosmf"],
            testName: "properties_workflow"
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
        afterEach(async () => {
            // deleting workflow
            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
        });
        it("Successful call without optional parameters returns properties response", async () => {
            let error;
            let response: IWorkflowInfo;

            try {
               response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, wfKey, wfVersion, propertiesSteps, propertiesVariables);
               Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowID).toContain("Greeting");

        });
        it("Successful call with steps parameter returns IRegisteredWorkflow properties response.", async () => {
            let error;
            let response: IWorkflowInfo;

            try {
               response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, wfKey, wfVersion, true, propertiesVariables);
               Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowID).toContain("Greeting");
            expect(response.steps[0].name).toContain("echo");

        });
        it("Successful call with variables returns IRegisteredWorkflow properties response.", async () => {
            let error;
            let response: IWorkflowInfo;

            try {
               response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, wfKey, wfVersion, propertiesSteps, true);
               Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowID).toContain("Greeting");
            expect(response.variables[0].name).toContain("GREETING");

        });
        it("Successful call with all optional parameters returns IRegisteredWorkflow properties response.", async () => {
            let error;
            let response: IWorkflowInfo;

            try {
               response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, wfKey, wfVersion, true, true);
               Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowID).toContain("Greeting");
            expect(response.steps[0].name).toContain("echo");
            expect(response.variables[0].name).toContain("GREETING");

        });
        it("Successful call with undefined optional parameters returns IRegisteredWorkflow properties response.", async () => {
            let error;
            let response: IWorkflowInfo;

            try {
               response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, wfKey, wfVersion, undefined, undefined);
               Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowID).toContain("Greeting");

        });
        it("Successful call with null optional parameters returns IRegisteredWorkflow properties response.", async () => {
            let error;
            let response: IWorkflowInfo;

            try {
               response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, wfKey, wfVersion, null, null);
               Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowID).toContain("Greeting");

        });
        it("Successful call with undefined zosmf verison (used default) returns properties response", async () => {
            let error;
            let response: IWorkflowInfo;

            try {
               response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, wfKey, undefined, propertiesSteps, propertiesVariables);
               Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowID).toContain("Greeting");

        });
    });
    describe("Fail scenarios", () => {
        beforeAll(async () => {
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
        afterEach(async () => {
            // deleting workflow
            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
        });
        it("Throws an error with undefined session.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await PropertiesWorkflow.getWorkflowProperties(undefined, wfKey, wfVersion, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSession.message);
        });
        it("Throws an error with undefined workflow key.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, undefined, wfVersion, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowKey.message);
        });
        it("Throws an error with workflow key as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, "", wfVersion, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowKey.message);
        });
        it("Throws an error with zOSMF version as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await PropertiesWorkflow.getWorkflowProperties(REAL_SESSION, wfKey, "", propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });
    });
});
