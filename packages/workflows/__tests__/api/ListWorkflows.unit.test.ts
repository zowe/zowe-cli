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
import { Session, ImperativeError, Imperative } from "@brightside/imperative";
import { ListWorkflows } from "../../../workflows";
import { WorkflowConstants, wrongString, noSession, noWorkflowName } from "../../src/api/WorkflowConstants";
import { IWorkflowsInfo } from "../../src/api/doc/IWorkflowsInfo";
import { IActiveWorkflows } from "../../src/api/doc/IActiveWorkflows";

const system = "SYS1";
const category = "Provisioning";
const statusName = "complete";
const owner = "owner1";
const vendor = "IBM";
const workflowName = "workflow1";
const badString = "Ba?d";
const badString1 = "Ba&d";

const START_RESOURCE_QUERY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/${WorkflowConstants.WORKFLOW_RESOURCE}`;
const PRETEND_URL = START_RESOURCE_QUERY + `?workflowName=${workflowName}&category=${category}`
                                         + `&system=${system}&owner=${owner}&vendor=${vendor}&statusName=${statusName}`;

const PRETEND_ZOSMF_RESPONSE: IWorkflowsInfo = {
    workflowKey: "73c81ef4-eccc-47ce-8f08-8a5c97e753f1",
    workflowName: "workflow1",
    workflowDescription: "Workflow test",
    workflowID: "Workflow test",
    workflowVersion: "1.0",
    vendor: "IBM",
    owner: "owner1",
    category: "Provisioning",
    statusName: "complete",
    system: "SYS1"
};

const PRETEND_ZOSMF_RESPONSE_MULTIPLE_WF: IActiveWorkflows = {
    workflows: [
        {
            workflowKey: "73c81ef4-eccc-47ce-8f08-8a5c97e753f1",
            workflowName: "workflow1",
            workflowDescription: "Workflow test",
            workflowID: "Workflow test",
            workflowVersion: "1.0",
            vendor: "IBM",
            owner: "owner1",
            category: "Provisioning",
            statusName: "complete",
            system: "SYS1"
        },
        {
            workflowKey: "73c81ef4-eccc-47ce-8f08-8a5c97e753f2",
            workflowName: "workflow2",
            workflowDescription: "Workflow test",
            workflowID: "Workflow test",
            workflowVersion: "1.0",
            vendor: "IBM",
            owner: "owner1",
            category: "Provisioning",
            statusName: "complete",
            system: "SYS1"
        }
    ]
} ;

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});


function expectZosmfResponseSucceeded(response: any, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: any, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("List workflows", () => {
    // List workflow that match all optional parameters
    it("Successful call with all optional parameters.", async () => {

        (ZosmfRestClient.getExpectJSON as any) = jest.fn<string>(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(PRETEND_ZOSMF_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: any;
        try {
            response = await ListWorkflows.listWorkflows(PRETEND_SESSION, undefined, workflowName, category, system, owner, vendor, statusName );
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, PRETEND_URL);
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
    });
    // List all workflows - without any optional parameters
    it("Successful call without any optional parameters.", async () => {

        (ZosmfRestClient.getExpectJSON as any) = jest.fn<string>(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(PRETEND_ZOSMF_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: any;
        try {
            response = await ListWorkflows.listWorkflows(PRETEND_SESSION);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY);
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
    });

    describe("Fail scenarios", () => {
        it("Throws an error with incorrect parameter format.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.listWorkflows(PRETEND_SESSION, undefined, badString, badString1, badString, badString, badString);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, wrongString.message);
        });
        it("Throws an error with undefined session.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.listWorkflows(undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
              error = thrownError;
              Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSession.message);
        });
    });
});
describe("Get workflow key by name", () => {
    describe("Success scenarios", () => {
        it("Returns wf key if only one wf with requested name was found", async () => {
            const apiResponse = {workflows: [PRETEND_ZOSMF_RESPONSE]};
            (ZosmfRestClient.getExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(apiResponse);
                    });
                });
            });
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.getWfKey(PRETEND_SESSION, workflowName);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
              error = thrownError;
              Imperative.console.info(`Error ${error}`);
            }
            expect(response).toBe(apiResponse.workflows[0].workflowKey);
            expect(error).toBe(undefined);
        });

        it("Returns null if no workflow with requested name was found", async () => {
            (ZosmfRestClient.getExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve({workflows: []});
                    });
                });
            });
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.getWfKey(PRETEND_SESSION, workflowName);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
              error = thrownError;
              Imperative.console.info(`Error ${error}`);
            }
            expect(response).toBe(null);
            expect(error).toBe(undefined);
        });
    });
    describe("Fail scenarios", () => {
        it("Throws an error with undefined session.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.getWfKey(undefined, workflowName);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
              error = thrownError;
              Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSession.message);
        });
        it("Throws an error with undefined wf key.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.getWfKey(PRETEND_SESSION, undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
              error = thrownError;
              Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowName.message);
        });
        it("Throws an error if multiple wf were found.", async () => {
            (ZosmfRestClient.getExpectJSON as any) = jest.fn<string>(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(PRETEND_ZOSMF_RESPONSE_MULTIPLE_WF);
                    });
                });
            });
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.getWfKey(PRETEND_SESSION, "workflow.*");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
              error = thrownError;
              Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, "More than one workflows found with name");
        });
    });
});
