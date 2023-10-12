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
import { ImperativeError, Session } from "@zowe/imperative";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ICreatedWorkflow } from "../../../src/doc/ICreatedWorkflow";
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
const status400 = 400;
const notFound = 404;

function expectZosmfResponseSucceeded(response: ICreatedWorkflow, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
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
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error: " + inspect(error));
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
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error: " + inspect(error));
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
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error: " + inspect(error));
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
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response.workflowKey).toBeDefined();
            // TODO: after properties API is created check also if variable has the right value, something like that:
            // expect(propResponse.variables.value).toContain("Hello world");
            wfKey = response.workflowKey;
        });
    });
    describe("Failure scenarios", () => {
        const produceError = async (...args: any[]): Promise<ImperativeError> => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow.call(CreateWorkflow, ...args);
                // Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                // Imperative.console.info(`Error ${error}`);
            }
            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            return error;
        };

        it("Throws an error with incorrect variable format.", async () => {
            const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner, null, "WRONG_VAR");
            expect(error.details.msg).toContain("Incorrect properties format: WRONG_VAR");
        });
        it("Throws an error with undefined session.", async () => {
            const error = await produceError(undefined, wfName, definitionFile, system, owner);
            expect(error.details.msg).toContain(noSession.message);
        });
        it("Throws an error with undefined workflow name.", async () => {
            const error = await produceError(REAL_SESSION, undefined, definitionFile, system, owner);
            expect(error.details.msg).toContain(noWorkflowName.message);
        });
        it("Throws an error with undefined workflow definition file.", async () => {
            const error = await produceError(REAL_SESSION, wfName, undefined, system, owner);
            expect(error.details.msg).toContain(noWorkflowDefinitionFile.message);
        });
        it("Throws an error with undefined system name.", async () => {
            const error = await produceError(REAL_SESSION, wfName, definitionFile, undefined, owner);
            expect(error.details.msg).toContain(noSystemName.message);
        });
        it("Throws an error with undefined owner.", async () => {
            const error = await produceError(REAL_SESSION, wfName, definitionFile, system, undefined);
            expect(error.details.msg).toContain(noOwner.message);
        });
        it("Throws an error with wrong format of owner.", async () => {
            const error = await produceError(REAL_SESSION, wfName, definitionFile, system, "__wrongID");
            expect(error.details.msg).toContain(wrongOwner.message);
        });
        it("Throws an error with workflow name as empty string.", async () => {
            const error = await produceError(REAL_SESSION, "", definitionFile, system, owner);
            expect(error.details.msg).toContain(noWorkflowName.message);
        });
        it("Throws an error with workflow definition file as empty string.", async () => {
            const error = await produceError(REAL_SESSION, wfName, "", system, owner);
            expect(error.details.msg).toContain(noWorkflowDefinitionFile.message);
        });
        it("Throws an error with system name as empty string.", async () => {
            const error = await produceError(REAL_SESSION, wfName, definitionFile, "", owner);
            expect(error.details.msg).toContain(noSystemName.message);
        });
        it("Throws an error with owner as empty string.", async () => {
            const error = await produceError(REAL_SESSION, wfName, definitionFile, system, "");
            expect(error.details.msg).toContain(noOwner.message);
        });
        it("Throws an error with zOSMF version as empty string.", async () => {
            const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner, null, null, null, null, null, "");
            expect(error.details.msg).toContain(nozOSMFVersion.message);
        });

        describe("IZUWF0101E", () => {
            const messageId = "IZUWF0101E";
            // https://www.ibm.com/docs/en/zos/2.5.0?topic=izuwf9999-izuwf0101e
            it("Throws an error with wrong format of workflow definition file. Wrong member name.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "DS.NAME(0)", system, owner);
                expect(error.errorCode).toEqual(notFound);
                expect(error.message).toContain(messageId);
            });
        });
        describe("IZUWF0103E", () => {
            const messageId = "IZUWF0103E";
            // https://www.ibm.com/docs/en/zos/2.5.0?topic=izuwf9999-izuwf0103e
            it("Throws an error with wrong format of workflow definition file.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "wrongPath", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of workflow definition file. Name that ends with a period.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "DS.NAME.", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of workflow definition file. Path not from root.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "home/file", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of workflow definition file. Qualifier is longer than 8 characters.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "DS.NAME.LONGFIELD", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of workflow definition file. More than 44 characters for DSNAME alone.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "DS.NAME.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of workflow definition file. Name containing two successive periods.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "DS..NAME", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of definition file. Name contains a qualifier that starts with numeric character.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "DS.123.NAME", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of workflow definition file. Member name is too long.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "DS.NAME(MEMBER123)", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of workflow definition file. Member doesn't end with `)`.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "DS.NAME(MEMBER", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of workflow definition file. Name contains non-allowed character.", async () => {
                const error = await produceError(REAL_SESSION, wfName, "DS.NAME%", system, owner);
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
        });
        describe("IZUWF0105E", () => {
            const messageId = "IZUWF0105E";
            // https://www.ibm.com/docs/en/zos/2.5.0?topic=izuwf9999-izuwf0105e
            it("Throws an error with wrong format of variable input file. Name does not exist.", async () => {
                const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner, "DS.NAME.WRONG");
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of variable input file. Wrong member name.", async () => {
                const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner, "DS.NAME(0)");
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
        });
        describe("IZUWF0107E", () => {
            const messageId = "IZUWF0107E";
            // https://www.ibm.com/docs/en/zos/2.5.0?topic=izuwf9999-izuwf0107e
            it("Throws an error with wrong format of variable input file. Name that ends with a period.", async () => {
                const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner, "DS.NAME.");
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of variable input file. More than 44 characters for DSNAME alone.", async () => {
                const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner,
                    "DS.NAME.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF.STUFF");
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of variable input file. Name containing two successive periods.", async () => {
                const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner, "DS..NAME");
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Name that contains a qualifier that starts with non-alphabetic or non-special character.", async () => {
                const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner, "DS.123.NAME");
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of variable input file. Qualifier is longer than 8 characters.", async () => {
                const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner, "DS.NAME.LONGFIELD");
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
            it("Throws an error with wrong format of variable input file. Path not from root.", async () => {
                const error = await produceError(REAL_SESSION, wfName, definitionFile, system, owner, "home/file");
                expect(error.errorCode).toEqual(status400);
                expect(error.message).toContain(messageId);
            });
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
                // Imperative.console.info("Error: " + inspect(err));
            }
        });
        it("Should create workflow in zOSMF with variable input file.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflowLocal(REAL_SESSION, wfName, workflow, system, owner, vars);
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error: " + inspect(error));
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
                // Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                // Imperative.console.info("Error: " + inspect(error));
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
