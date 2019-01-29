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
import {
    WorkflowConstants,
    noSession,
    nozOSMFVersion
} from "../../src/api/WorkflowConstants";
import { IWorkflowsInfo } from "../../src/api/doc/IWorkflowsInfo";

const system = "SYS1";
const category = "Provisioning";
const statusName = "complete";
const owner = "owner1";
const vendor = "IBM";
const nosystem = "null";
const nostatusname = "null";
const novendor = "null";
const noowner = "null";
const propertiesText = "WRONG_VAR"

const START_RESOURCE_QUERY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/${WorkflowConstants.WORKFLOW_RESOURCE}`;

const PRETEND_ZOSMF_RESPONSE: IWorkflowsInfo = {
    workflowKey: "73c81ef4-eccc-47ce-8f08-8a5c97e753f1",
    workflowDescription: "Workflow test",
    workflowID: "Workflow test",
    workflowVersion: "1.0",
    vendor: "IBM",
    owner: "owner1",
    category: "Provisioning",
    statusName: "complete",
    system: "SYS1"
};
const PRETEND_INPUT: IWorkflowsInfo = {
    category: category,
    system: system,
    owner: owner,
    vendor: vendor,
    statusName: statusName
};
const PRETEND_OUTPUT: IWorkflowsInfo = {
"category": "Provisioning", 
"owner": "owner1", 
"statusName": "complete", 
"system": "SYS1", 
"vendor": "IBM", 
"workflowDescription": "Workflow test", 
"workflowID": "Workflow test", 
"workflowKey": "73c81ef4-eccc-47ce-8f08-8a5c97e753f1", 
"workflowVersion": "1.0"
};

const PRETEND_URL = "/zosmf/workflow/rest/Provisioning/workflows?category=owner1&system=complete&owner=SYS1&vendor=IBM"
const PRETEND_URL_NULL = "/zosmf/workflow/rest/1.0/workflows?vendor=null&statusName?=null"
const PRETEND_URL_SYSTEM = "/zosmf/workflow/rest/1.0/workflows?category=Provisioning&system=complete"
const PRETEND_URL_NOOWNER = "/zosmf/workflow/rest/1.0/workflows?owner=null&vendor=null"
const PRETEND_URL_NOVENDOR = "/zosmf/workflow/rest/1.0/workflows?vendor=null&statusName=null"
const PRETEND_URL_NOSTATUS = "/zosmf/workflow/rest/1.0/workflows?system=null&owner=null"

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
            response = await ListWorkflows.listWorkflows(PRETEND_SESSION, category, owner, statusName, system, vendor );
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

    
        it("Successful call with empty optional parameters", async () => {
    
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
                response = await ListWorkflows.listWorkflows(PRETEND_SESSION, undefined, null, null, null, novendor, nostatusname );
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, PRETEND_URL_NOVENDOR);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });

        it("Successful call with empty optional parameters", async () => {
    
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
                response = await ListWorkflows.listWorkflows(PRETEND_SESSION, undefined, null, null, noowner, novendor, null );
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, PRETEND_URL_NOOWNER);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });
    
        it("Successful call with empty optional parameters", async () => {
    
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
                response = await ListWorkflows.listWorkflows(PRETEND_SESSION, undefined, null, novendor, nostatusname, null, null );
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, PRETEND_URL_NOSTATUS);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
        });


    it("Successful call without ANY optional parameters.", async () => {

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


    it(" Should succeed even with zOSMF version undefined (because of default value).", async () => {
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
            response = await ListWorkflows.listWorkflows(PRETEND_SESSION, undefined, category, statusName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, PRETEND_URL_SYSTEM);
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
    });
/*

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
    }); */
});

