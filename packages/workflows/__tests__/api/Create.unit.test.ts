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

import { ZosmfRestClient } from "../../../rest";
import { Session, ImperativeError, Imperative, Headers } from "@brightside/imperative";
import { CreateWorkflow } from "../../../workflows";
import {
    WorkflowConstants,
    noSession,
    noWorkflowName,
    noWorkflowDefinitionFile,
    noSystemName,
    noOwner,
    nozOSMFVersion,
    wrongOwner
} from "../../src/api/WorkflowConstants";
import { ICreatedWorkflow } from "../../src/api/doc/ICreatedWorkflow";
import { ICreateWorkflow } from "../../src/api/doc/ICreateWorkflow";
import { IVariable } from "../../src/api/doc/IVariables";
import { Upload, ZosFilesConstants, Delete } from "../../../zosfiles/src/api";

const wfName = "Test-Workflow";
const wfDefinitionFile = "/tmp/workflow.xml";
const systemName = "SYS1";
const wfOwner = "ABCDE01";
const varInputFile = "/tmp/var.properties";
const variables = "DUMMY=DUMMY";
const assign = true;
const access = "Public";
const deleteJobs = false;
const propertiesText = "WRONG_VAR";

const START_RESOURCE_QUERY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/${WorkflowConstants.WORKFLOW_RESOURCE}`;

const PRETEND_ZOSMF_RESPONSE: ICreatedWorkflow = {
    workflowKey: "73c81ef4-eccc-47ce-8f08-8a5c97e753f1",
    workflowDescription: "Create workflow test",
    workflowID: "Workflow test",
    workflowVersion: "1.0",
    vendor: "CA Technologies, a Broadcom company"
};
const Variable: IVariable = {
    name: "DUMMY",
    value: "DUMMY"
};
const PRETEND_INPUT_PARMS: ICreateWorkflow = {
    workflowName: wfName,
    workflowDefinitionFile: wfDefinitionFile,
    system: systemName,
    owner: wfOwner,
    assignToOwner: assign,
    accessType: access,
    deleteCompletedJobs: deleteJobs,
    variableInputFile: varInputFile,
    variables: [Variable]
};
const PRETEND_INPUT_PARMS_NO_INPUT: ICreateWorkflow = {
    workflowName: wfName,
    workflowDefinitionFile: wfDefinitionFile,
    system: systemName,
    owner: wfOwner,
    assignToOwner: assign,
    accessType: access,
    deleteCompletedJobs: deleteJobs
};
const PRETEND_INPUT_PARMS_EMPTY_VAR: ICreateWorkflow = {
    workflowName: wfName,
    workflowDefinitionFile: wfDefinitionFile,
    system: systemName,
    owner: wfOwner,
    assignToOwner: assign,
    accessType: access,
    deleteCompletedJobs: deleteJobs,
    variables: []
};
const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});
const HEAD = Headers.APPLICATION_JSON;

function expectZosmfResponseSucceeded(response: any, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: any, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}
describe("Create workflow", () => {
    describe("Successful scenarios", () => {
        it("Successful call with all parameters returns IRegisteredWorkflow response.", async () => {

            (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner, varInputFile,
                    variables, assign, access, deleteJobs);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [HEAD], PRETEND_INPUT_PARMS);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });

        it("Successful call without optional parameters returns IRegisteredWorkflow response.", async () => {

            (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY,
                [HEAD], PRETEND_INPUT_PARMS_NO_INPUT);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });
        it("Successful call without optional parameters and variables are empty string returns IRegisteredWorkflow response.", async () => {

            (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner,
                    null,"");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [HEAD],
                PRETEND_INPUT_PARMS_EMPTY_VAR);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });
        it("Should succeed even with zOSMF version undefined (because of default value).", async () => {
            (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner,  null,
                    null, null, null, null, undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY,
                [HEAD], PRETEND_INPUT_PARMS_NO_INPUT);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });
        it("Successful call with short DSNAME.", async () => {
            PRETEND_INPUT_PARMS_NO_INPUT.workflowDefinitionFile = "A.A.C";
            const definitionFile = PRETEND_INPUT_PARMS_NO_INPUT.workflowDefinitionFile;
            (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, definitionFile, systemName, wfOwner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY,
                [HEAD], PRETEND_INPUT_PARMS_NO_INPUT);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });
        it("Successful call with DSNAME including member.", async () => {
            PRETEND_INPUT_PARMS_NO_INPUT.workflowDefinitionFile = "DATA.SET(MEMBER)";
            const definitionFile = PRETEND_INPUT_PARMS_NO_INPUT.workflowDefinitionFile;
            (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, definitionFile, systemName, wfOwner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY,
                [HEAD], PRETEND_INPUT_PARMS_NO_INPUT);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });
        it("Successful call with DSNAME starting with special character(allowed one).", async () => {
            PRETEND_INPUT_PARMS_NO_INPUT.workflowDefinitionFile = "#DATA.SET";
            const definitionFile = PRETEND_INPUT_PARMS_NO_INPUT.workflowDefinitionFile;
            (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, definitionFile, systemName, wfOwner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY,
                [HEAD], PRETEND_INPUT_PARMS_NO_INPUT);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });
    });
    describe("Fail scenarios", () => {
        it("Throws an error with incorrect variable format.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner,
                    null,propertiesText);
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
                response = await CreateWorkflow.createWorkflow(undefined, wfName, wfDefinitionFile, systemName, wfOwner);
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
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, undefined, wfDefinitionFile, systemName, wfOwner);
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
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, undefined, systemName, wfOwner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowDefinitionFile.message);
        });
        it("Throws an error with undefined system name.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, undefined, wfOwner);
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
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, undefined);
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
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, "__wrongID");
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
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner,  null,
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
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, "", wfDefinitionFile, systemName, wfOwner);
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
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, "", systemName, wfOwner);
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
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, "", wfOwner);
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
                response = await CreateWorkflow.createWorkflow(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, "");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noOwner.message);
        });
    });
});
describe("Create workflow from local file", () => {
    describe("Successful scenarios", () => {
        it("Should succeed even with zOSMF version undefined (because of default value).", async () => {
            (Upload.fileToUSSFile as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve("success");
                    });
                });
            });
            (CreateWorkflow.getTempFile as any) = jest.fn<string>(() => {
                return PRETEND_INPUT_PARMS.workflowDefinitionFile;
            });
            (CreateWorkflow.createWorkflow as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner, varInputFile,
                    variables, assign, access, deleteJobs);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((Upload.fileToUSSFile as any)).toHaveBeenCalledTimes(2);
            expect((CreateWorkflow.createWorkflow as any)).toHaveBeenCalledTimes(1);
            expect((CreateWorkflow.createWorkflow as any)).toHaveBeenCalledWith(PRETEND_SESSION, wfName, PRETEND_INPUT_PARMS.workflowDefinitionFile,
                systemName, wfOwner, PRETEND_INPUT_PARMS.workflowDefinitionFile, variables, assign, access, deleteJobs,
                WorkflowConstants.ZOSMF_VERSION);
        });
        it("Should succeed and keep files", async () => {
            (Upload.fileToUSSFile as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve("success");
                    });
                });
            });
            (CreateWorkflow.getTempFile as any) = jest.fn<string>(() => {
                return PRETEND_INPUT_PARMS.workflowDefinitionFile;
            });
            (CreateWorkflow.createWorkflow as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner, varInputFile,
                    variables, assign, access, deleteJobs, true);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((Upload.fileToUSSFile as any)).toHaveBeenCalledTimes(2);
            expect((CreateWorkflow.createWorkflow as any)).toHaveBeenCalledTimes(1);
            expect((CreateWorkflow.createWorkflow as any)).toHaveBeenCalledWith(PRETEND_SESSION, wfName, PRETEND_INPUT_PARMS.workflowDefinitionFile,
                systemName, wfOwner, PRETEND_INPUT_PARMS.workflowDefinitionFile, variables, assign, access, deleteJobs,
                WorkflowConstants.ZOSMF_VERSION);
            expect(response.filesKept).toBeDefined();
            expect(response.filesKept).toContain(PRETEND_INPUT_PARMS.workflowDefinitionFile);
        });
    });
    describe("Fail scenarios", () => {
        it("Throws an error with undefined session.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflowLocal(undefined, wfName, wfDefinitionFile, systemName, wfOwner);
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
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, undefined, wfDefinitionFile, systemName, wfOwner);
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
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, undefined, systemName, wfOwner);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowDefinitionFile.message);
        });
        it("Throws an error with undefined system name.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, wfDefinitionFile, undefined, wfOwner);
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
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, undefined);
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
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, "__wrongID");
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
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner,  null,
                    null, null, null, null, false, null, "");
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
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, "", wfDefinitionFile, systemName, wfOwner);
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
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, "", systemName, wfOwner);
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
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, wfDefinitionFile, "", wfOwner);
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
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, "");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noOwner.message);
        });
        it("Throws an error if uss files were not uploaded successfully", async () => {
            let error: ImperativeError;
            let response: any;
            (Upload.fileToUSSFile as any) = jest.fn<string>(() => {
                return new Promise((resolve, reject) => {
                    process.nextTick(() => {
                        reject(new ImperativeError({msg : "failed"}));
                    });
                });
            });
            (CreateWorkflow.createWorkflow as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });
            try {
                response = await CreateWorkflow.createWorkflowLocal(PRETEND_SESSION, wfName, wfDefinitionFile, systemName, wfOwner, varInputFile,
                    variables, assign, access, deleteJobs);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((CreateWorkflow.createWorkflow as any)).toHaveBeenCalledTimes(0);
            expectZosmfResponseFailed(response, error, "Failed to create temporary uss file");
        });
    });
});
