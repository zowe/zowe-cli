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

import { CreateWorkflow, DeleteWorkflow } from "../../../src";
import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ICreatedWorkflow } from "../../../src/doc/ICreatedWorkflow";
import { inspect } from "util";
import { getUniqueDatasetName } from "../../../../../__tests__/__src__/TestUtils";
import {
    noOwner,
    noSystemName,
    noWorkflowDefinitionFile,
    noWorkflowName,
    wrongOwner
} from "../../../src/WorkflowConstants";
import { ICreatedWorkflowLocal } from "../../../src/doc/ICreatedWorkflowLocal";
import { Upload, ZosFilesConstants, Delete } from "@zowe/zos-files-for-zowe-sdk";
import { ZosmfRestClient, nozOSMFVersion, noSession } from "@zowe/core-for-zowe-sdk";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;
let inputFile: string;
let tempDefFile: string;
let tempVarFile: string;

const workflow = __dirname + "/../testfiles/demo.xml";
const vars = __dirname + "/../testfiles/vars.properties";
const propertiesText = "WRONG_VAR";
const wrongPath = 400;
const notFound = 404;

function expectZosmfResponseSucceeded(response: ICreatedWorkflow, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: ICreatedWorkflow, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("Create workflow", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "create_workflow"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
        definitionFile = `${defaultSystem.unix.testdir}/${getUniqueDatasetName(owner)}.xml`;
        inputFile = `${defaultSystem.unix.testdir}/${getUniqueDatasetName(owner)}.properties`;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Success Scenarios", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUSSFile(REAL_SESSION, workflow, definitionFile, true);
            await Upload.fileToUSSFile(REAL_SESSION, vars, inputFile, true);
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
            try {
                const inputEndpoint = endpoint + inputFile;
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, inputEndpoint);
            } catch (err) {
                error = err;
            }
        });
        afterEach(async () => {
            // deleting workflow
            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
        });
        it("Should create workflow in zOSMF.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowKey).toBeDefined();
            wfKey = response.workflowKey;
        });
        it("Should create workflow in zOSMF with variable input file.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, inputFile);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowKey).toBeDefined();
            wfKey = response.workflowKey;
        });
        it("Should create workflow in zOSMF with variable.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, null,
                    "GREETING=HELLO WORLD");
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowKey).toBeDefined();
            // TODO: after properties API is created check also if variable has the right value, something like that:
            // expect(propResponse.variables.value).toContain("Hello world");
            wfKey = response.workflowKey;
        });
        it("Should create workflow in zOSMF with all options.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, inputFile,
                    "GREETING=HELLO WORLD", true, "Public", false, "1.0");
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowKey).toBeDefined();
            // TODO: after properties API is created check also if variable has the right value, something like that:
            // expect(propResponse.variables.value).toContain("Hello world");
            wfKey = response.workflowKey;
        });
    });
    describe("Failure scenarios", () => {
        it("Throws an error with incorrect variable format.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner,
                    null, propertiesText);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, `Incorrect properties format: ${propertiesText}`);
        });
        it("Throws an error with undefined session.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(undefined, wfName, definitionFile, system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSession.message);
        });
        it("Throws an error with undefined workflow name.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, undefined, definitionFile, system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowName.message);
        });
        it("Throws an error with undefined workflow definition file.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, undefined, system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowDefinitionFile.message);
        });
        it("Throws an error with wrong format of workflow definition file.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "wrongPath", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
        it("Throws an error with undefined system name.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, undefined, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSystemName.message);
        });
        it("Throws an error with undefined owner.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noOwner.message);
        });
        it("Throws an error with wrong format of owner.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, "__wrongID");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, wrongOwner.message);
        });
        it("Throws an error with zOSMF version as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, null,
                    null, null, null, null, "");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });
        it("Throws an error with workflow name as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, "", definitionFile, system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowName.message);
        });
        it("Throws an error with workflow definition file as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowDefinitionFile.message);
        });
        it("Throws an error with system name as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, "", owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSystemName.message);
        });
        it("Throws an error with owner as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, "");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noOwner.message);
        });
        it("Throws an error with wrong format of variable input file. Name that ends with a period.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, "DS.NAME.");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(notFound);
        });
        it("Throws an error with wrong format of variable input file. Wrong member name.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, "DS.NAME(0)");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(notFound);
        });
        it("Throws an error with wrong format of variable input file. Path not from root.", async () => {
            //
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, "home/file");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(notFound);
        });
        it("Throws an error with wrong format of variable input file. Qualifier is longer than 8 characters.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, "DS.NAME.LONGFIELD");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(notFound);
        });
        it("Throws an error with wrong format of variable input file. More than 44 characters for DSNAME alone.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner,
                    "DS.NAME.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(notFound);
        });
        it("Throws an error with wrong format of variable input file. Name containing two successive periods.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, "DS..NAME");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(notFound);
        });
        it("Throws an error with wrong path. Name that contains a qualifier that starts with non-alphabetic or non-special character", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, "DS.123.NAME");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(notFound);
        });
        it("Throws an error with wrong format of workflow definition file. Name that ends with a period.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "DS.NAME.", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
        it("Throws an error with wrong format of workflow definition file. Wrong member name.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "DS.NAME(0)", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(notFound);
        });
        it("Throws an error with wrong format of workflow definition file. Path not from root.", async () => {
            //
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "home/file", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
        it("Throws an error with wrong format of workflow definition file. Qualifier is longer than 8 characters.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "DS.NAME.LONGFIELD", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
        it("Throws an error with wrong format of workflow definition file. More than 44 characters for DSNAME alone.", async () => {
            let error: ImperativeError;
            let response: any;
            const longDSN = "DS.NAME.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF";
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, longDSN, system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
        it("Throws an error with wrong format of workflow definition file. Name containing two successive periods.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "DS..NAME", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
        it("Throws an error with wrong format of definition file. Name contains a qualifier that starts with numeric character", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "DS.123.NAME", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
        it("Throws an error with wrong format of workflow definition file. Member name is too long.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "DS.NAME(MEMBER123)", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
        it("Throws an error with wrong format of workflow definition file. Member doesn't end with `)`.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "DS.NAME(MEMBER", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
        it("Throws an error with wrong format of workflow definition file. Name contains non-allowed character.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, "DS.NAME%", system, owner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect(error.errorCode).toEqual(wrongPath);
        });
    });
    describe("Success Scenarios create from local file", () => {
        afterEach(async () => {
            // deleting workflow
            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
            try {
                await Delete.ussFile(REAL_SESSION, tempDefFile.slice(1));
                await Delete.ussFile(REAL_SESSION, tempVarFile.slice(1));
            } catch (err) {
                Imperative.console.info("Error: " + inspect(err));
            }
        });
        it("Should create workflow in zOSMF with variable input file.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflowLocal(REAL_SESSION, wfName, workflow, system, owner, vars);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowKey).toBeDefined();
            wfKey = response.workflowKey;
        });
        it("Should create workflow in zOSMF with variable input file and keep the files", async () => {
            let error;
            let response: ICreatedWorkflowLocal;

            try {
                response = await CreateWorkflow.createWorkflowLocal(REAL_SESSION, wfName, workflow, system, owner, vars, null, false, null,
                    false, true);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).not.toBeDefined();
            expect(response).toBeDefined();
            expect(response.workflowKey).toBeDefined();
            expect(response.filesKept).toBeDefined();
            expect(response.filesKept).toHaveLength(2);
            wfKey = response.workflowKey;
            tempDefFile = response.filesKept[0];
            tempVarFile = response.filesKept[1];
        });
    });
});
