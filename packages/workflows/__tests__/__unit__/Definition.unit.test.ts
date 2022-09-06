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

import { ZosmfRestClient, nozOSMFVersion, noSession } from "@zowe/core-for-zowe-sdk";
import { Session, ImperativeError, Imperative, Headers } from "@zowe/imperative";
import { DefinitionWorkflow } from "../../src";
import {
    WorkflowConstants,
    noWorkflowDefinitionFile
} from "../../src/WorkflowConstants";

import { IWorkflowDefinition } from "../../src/doc/IWorkflowDefinition";
import { IStepDefinition } from "../../src/doc/IStepDefinition";
import { IVariableDefinition } from "../../src/doc/IVariableDefinition";
import { IVariableSpecification } from "../../src/doc/IVariableSpecification";
import { IStepApprovers } from "../../src/doc/IStepApprovers";
import { IPropertyMapping } from "../../src/doc/IPropertyMapping";

const wfDefinitionFile = "/tmp/workflow.xml";
const wfPath = "/a/wf1.xml";
const wfVersion = "1.0";
const propertiesSteps = false;
const propertiesVariables = false;
const START_RESOURCE_QUERY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/${WorkflowConstants.WORKFLOW_DEFINITION}?` +
    `${WorkflowConstants.filePath}=${wfPath}`;
const START_RESOURCE_QUERY_ALL_PARMS: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/` +
    `${WorkflowConstants.WORKFLOW_DEFINITION}?${WorkflowConstants.filePath}=${wfPath}&${WorkflowConstants.returnData}=${WorkflowConstants.steps},` +
    `${WorkflowConstants.variables}`;
const START_RESOURCE_QUERY_STEPS: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/` +
    `${WorkflowConstants.WORKFLOW_DEFINITION}?${WorkflowConstants.filePath}=${wfPath}&${WorkflowConstants.returnData}=${WorkflowConstants.steps}`;
const START_RESOURCE_QUERY_VARIABLES: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/` +
    `${WorkflowConstants.WORKFLOW_DEFINITION}?${WorkflowConstants.filePath}=${wfPath}&${WorkflowConstants.returnData}=${WorkflowConstants.variables}`;

const failedPatterns: string[] = ["patern1", "patern2"];
const scriptParameters: string[] = ["patern1", "patern2", "patern3"];
const prereqSteps: string[] = ["Step1", "Step6"];

const prop1: IPropertyMapping = {
    mapFrom: "AABB",
    mapTo: "var1"
};

const prop2: IPropertyMapping = {
    mapFrom: "XXYY",
    mapTo: "var2"
};

const propertyMappingsArray: IPropertyMapping[] = [prop1,prop2];

const approver1: IStepApprovers = {
    approver: "ZLAP00",
    approverSub: false
};

const approver2: IStepApprovers = {
    approver: "MLA01",
    approverSub: false
};

const approversArray: IStepApprovers[] = [approver1,approver2];

const varSpec1: IVariableSpecification = {
    name: "var1",
    scope: "instance",
    required: false
};

const varSpec2: IVariableSpecification = {
    name: "var2",
    scope: "instance",
    required: false
};

const variableSpecArray: IVariableSpecification[] = [varSpec1,varSpec2];

const PRETEND_ZOSMF_RESPONSE_STEPDEF01: IStepDefinition = {
    "name": "Step 01",
    "title": "STEP Title",
    "description": "Step description",
    "prereqStep": prereqSteps,
    "optional": false,
    // "steps": stepsContains,
    "calledWorkflowDescription": "Workflow description",
    "calledWorkflowID": "252525",
    "calledWorkflowMD5": "md5value",
    "calledWorkflowDefinitionFile": "definition file1",
    "calledWorkflowVersion": "v1",
    "callingStepAutoEnable": false,
    "callingStepWeight": 10,
    "callingStepSkills": "unix",
    "actualStatusCode": "404",
    "approvers": approversArray,
    "autoEnable": true,
    "expectedStatusCode": "404",
    "failedPattern": failedPatterns,
    "hostname": "CA11",
    "httpMethod": "PUT",
    "instructions": "Step instructions",
    "isRestStep": false,
    "maxLrecl": 255,
    "output": "Outputfile1",
    "outputVariablesPrefix": "PFX1",
    "port": "1212",
    "procName": "Name ABCD",
    "propertyMappings": propertyMappingsArray,
    "queryParameters": "A=A",
    "regionSize": "1024",
    "requestBody": "URL1",
    "saveAsDataset": "ABCD.ABCD1",
    "saveAsUnixFile": "file1",
    "schemeName": "scheme1",
    "scriptParameters": scriptParameters,
    "skills": "Mainframe",
    "submitAs": "ABCD1",
    "successPattern": "A=A",
    "template": "template1",
    "timeout": "100000",
    "uriPath": "cc/vv/gg",
    "variable-specifications": variableSpecArray,
    "weight": 10
};

const PRETEND_ZOSMF_RESPONSE_STEPDEF02: IStepDefinition = {
    "name": "Step 02",
    "title": "STEP Title 02",
    "description": "Step description",
    "prereqStep": prereqSteps,
    "optional": false,
    // "steps": stepsContains,
    "calledWorkflowDescription": "Workflow description",
    "calledWorkflowID": "252525",
    "calledWorkflowMD5": "md5value",
    "calledWorkflowDefinitionFile": "definition file2",
    "calledWorkflowVersion": "v1",
    "callingStepAutoEnable": false,
    "callingStepWeight": 10,
    "callingStepSkills": "unix",
    "actualStatusCode": "404",
    "approvers": approversArray,
    "autoEnable": true,
    "expectedStatusCode": "404",
    "failedPattern": failedPatterns,
    "hostname": "CA11",
    "httpMethod": "PUT",
    "instructions": "Step instructions",
    "isRestStep": false,
    "maxLrecl": 255,
    "output": "Outputfile1",
    "outputVariablesPrefix": "PFX1",
    "port": "1212",
    "procName": "Name ABCD",
    "propertyMappings": propertyMappingsArray,
    "queryParameters": "A=A",
    "regionSize": "1024",
    "requestBody": "URL1",
    "saveAsDataset": "ABCD.ABCD1",
    "saveAsUnixFile": "file1",
    "schemeName": "scheme1",
    "scriptParameters": scriptParameters,
    "skills": "Mainframe",
    "submitAs": "ABCD1",
    "successPattern": "A=A",
    "template": "template1",
    "timeout": "100000",
    "uriPath": "cc/vv/gg",
    "variable-specifications": variableSpecArray,
    "weight": 10
};

const stepsContains: IStepDefinition[] = [PRETEND_ZOSMF_RESPONSE_STEPDEF01, PRETEND_ZOSMF_RESPONSE_STEPDEF02];

const PRETEND_ZOSMF_RESPONSE_STEPDEF: IStepDefinition = {
    "name": "Step 1",
    "title": "STEP Title",
    "description": "Step description",
    "prereqStep": prereqSteps,
    "optional": false,
    "steps": stepsContains,
    "calledWorkflowDescription": "Workflow description",
    "calledWorkflowID": "252525",
    "calledWorkflowMD5": "md5value",
    "calledWorkflowDefinitionFile": "definition file1",
    "calledWorkflowVersion": "v1",
    "callingStepAutoEnable": false,
    "callingStepWeight": 10,
    "callingStepSkills": "unix",
    "actualStatusCode": "404",
    "approvers": approversArray,
    "autoEnable": true,
    "expectedStatusCode": "404",
    "failedPattern": failedPatterns,
    "hostname": "CA11",
    "httpMethod": "PUT",
    "instructions": "Step instructions",
    "isRestStep": false,
    "maxLrecl": 255,
    "output": "Outputfile1",
    "outputVariablesPrefix": "PFX1",
    "port": "1212",
    "procName": "Name ABCD",
    "propertyMappings": propertyMappingsArray,
    "queryParameters": "A=A",
    "regionSize": "1024",
    "requestBody": "URL1",
    "saveAsDataset": "ABCD.ABCD1",
    "saveAsUnixFile": "file1",
    "schemeName": "scheme1",
    "scriptParameters": scriptParameters,
    "skills": "Mainframe",
    "submitAs": "ABCD1",
    "successPattern": "A=A",
    "template": "template1",
    "timeout": "100000",
    "uriPath": "cc/vv/gg",
    "variable-specifications": variableSpecArray,
    "weight": 10
};

const sDArray: IStepDefinition[] = new Array(PRETEND_ZOSMF_RESPONSE_STEPDEF);

const CHOICES: string[] = ["choice1","choice2"];

const PRETEND_ZOSMF_RESPONSE_VARIABLEDEF1: IVariableDefinition = {
    name: "VARIABLE1",
    scope: "global",
    abstract: "desc of var 1",
    category: "group 1",
    choice: CHOICES,
    decimalPlaces: 3,
    default: "PSX.ABC1",
    description: "description of variable",
    exposeToUser: true,
    maxLength: 15,
    maxValue: "100",
    minLength: 0,
    minValue: "0",
    promptAtCreate: true,
    regularExpression: "^[0-9A-Z$#@]{1,8}$",
    requiredAtCreate: false,
    type: "DSNAME",
    validationType: "DS",
    visibility: "public"
};
const PRETEND_ZOSMF_RESPONSE_VARIABLEDEF2: IVariableDefinition = {
    name: "VARIABLE2",
    scope: "global",
    abstract: "desc of var 2",
    category: "group 2",
    choice: CHOICES,
    decimalPlaces: 3,
    default: "PSX.ABC2",
    description: "description of variable",
    exposeToUser: true,
    maxLength: 15,
    maxValue: "100",
    minLength: 0,
    minValue: "0",
    promptAtCreate: true,
    regularExpression: "^[0-9A-Z]{1,6}$",
    requiredAtCreate: false,
    type: "DSNAME",
    validationType: "DS",
    visibility: "private"
};

const vDArray: IVariableDefinition[] = [PRETEND_ZOSMF_RESPONSE_VARIABLEDEF1,PRETEND_ZOSMF_RESPONSE_VARIABLEDEF2];

const PRETEND_ZOSMF_RESPONSE: IWorkflowDefinition = {
    workflowDefaultName: "wf1",
    workflowDescription: "test workflow properties",
    workflowID: "Workflow test",
    workflowVersion: "1.0",
    vendor: "CA Technologies, a Broadcom company",
    workflowDefinitionFileMD5Value: "md5value",
    isCallable: false,
    containsParallelSteps : false,
    scope: "instance",
    category: "general",
    productID: "CA",
    productName: "ZOWE",
    productVersion: "1.0"
    // steps
    // variables
};


const PRETEND_ZOSMF_RESPONSE_WITH_STEPS: IWorkflowDefinition = {
    workflowDefaultName: "wf1",
    workflowDescription: "test workflow properties",
    workflowID: "Workflow test",
    workflowVersion: "1.0",
    vendor: "CA Technologies, a Broadcom company",
    workflowDefinitionFileMD5Value: "md5value",
    isCallable: false,
    containsParallelSteps : false,
    scope: "instance",
    category: "general",
    productID: "CA",
    productName: "ZOWE",
    productVersion: "1.0",
    steps: sDArray
    // variables
};

const PRETEND_ZOSMF_RESPONSE_WITH_VARIABLES: IWorkflowDefinition = {
    workflowDefaultName: "wf1",
    workflowDescription: "test workflow properties",
    workflowID: "Workflow test",
    workflowVersion: "1.0",
    vendor: "CA Technologies, a Broadcom company",
    workflowDefinitionFileMD5Value: "md5value",
    isCallable: false,
    containsParallelSteps : false,
    scope: "instance",
    category: "general",
    productID: "CA",
    productName: "ZOWE",
    productVersion: "1.0",
    // steps: sDArray
    variables: vDArray
};

const PRETEND_ZOSMF_RESPONSE_WITH_STEPSANDVARIABLES: IWorkflowDefinition = {
    workflowDefaultName: "wf1",
    workflowDescription: "test workflow properties",
    workflowID: "Workflow test",
    workflowVersion: "1.0",
    vendor: "CA Technologies, a Broadcom company",
    workflowDefinitionFileMD5Value: "md5value",
    isCallable: false,
    containsParallelSteps : false,
    scope: "instance",
    category: "general",
    productID: "CA",
    productName: "ZOWE",
    productVersion: "1.0",
    steps: sDArray,
    variables: vDArray
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
describe("Get workflow definition", () => {
    describe("Successful scenarios", () => {
        it("Successful call without optional parameters returns IWorkflowDefinition definition response.", async () => {

            (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, wfVersion, wfPath, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [HEAD]);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });

        it("Successful call with all optional parameters returns IRegisteredWorkflow properties response.", async () => {

            (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE_WITH_STEPSANDVARIABLES);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, wfVersion, wfPath, true, true);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY_ALL_PARMS,
                [HEAD]);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE_WITH_STEPSANDVARIABLES);
        });

        it("Successful call with optional steps returns IRegisteredWorkflow properties response.", async () => {

            (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE_WITH_STEPS);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, wfVersion, wfPath, true, false);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY_STEPS,
                [HEAD]);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE_WITH_STEPS);
        });

        it("Successful call with optional variables returns IRegisteredWorkflow properties response.", async () => {

            (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE_WITH_VARIABLES);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, wfVersion, wfPath, false, true);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY_VARIABLES,
                [HEAD]);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE_WITH_VARIABLES);
        });

        it("Successful call with undefined zosmf version returns IRegisteredWorkflow properties response.", async () => {

            (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, undefined, wfPath, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [HEAD]);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });

        it("Successful call without optional parameters - both undefined returns IRegisteredWorkflow properties response.", async () => {

            (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, wfVersion, wfPath, undefined, undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [HEAD]);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });

        it("Successful call without optional parameters steps - set null IRegisteredWorkflow properties response.", async () => {

            (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, wfVersion, wfPath, null, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [HEAD]);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });

        it("Successful call without optional parameters variables - set null IRegisteredWorkflow properties response.", async () => {

            (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, wfVersion, wfPath, propertiesSteps, null);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [HEAD]);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });

        it("Successful call without both optional parameters variables - both set null IRegisteredWorkflow properties response.", async () => {

            (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE);
                    });
                });
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, wfVersion, wfPath, null, null);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [HEAD]);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });

    });

    describe("Fail scenarios", () => {
        it("Throws an error with undefined session.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(undefined, wfVersion, wfPath, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSession.message);
        });
        it("Throws an error with undefined Path.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.
                    getWorkflowDefinition(PRETEND_SESSION, wfVersion, undefined, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowDefinitionFile.message);
        });
        it("Throws an error with Path as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, wfVersion, "", propertiesSteps, propertiesVariables);
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
                response = await DefinitionWorkflow.getWorkflowDefinition(PRETEND_SESSION, "", wfPath, propertiesSteps, propertiesVariables);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });

    });
});
