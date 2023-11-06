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
import { Session, ImperativeError, Imperative, Headers } from "@zowe/core-for-zowe-sdk";
import { StartWorkflow } from "../../src";
import { WorkflowConstants, noWorkflowKey } from "../../src/WorkflowConstants";
import { IStartWorkflow, startT } from "../../src/doc/IStartWorkflow";

const wfKey = "1234567_abcde";
const conflict: startT = "outputFileValue";
const step = "Start";
const subsequet = false;

let START_RESOURCE_QUERY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/`;
START_RESOURCE_QUERY += `${WorkflowConstants.WORKFLOW_RESOURCE}/${wfKey}/${WorkflowConstants.START_WORKFLOW}`;

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


describe("Start workflow", () => {
    describe("Successful tests.", () => {

        it("Successful call returns 201 - no message. Test just with workflow key.", async () => {

            ZosmfRestClient.putExpectString = jest.fn(async () => {
                return "";
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(PRETEND_SESSION, wfKey);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY,
                [Headers.APPLICATION_JSON], {});
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual("");
        });
        it("Should succeed even with zOSMF version undefined(because of default value).", async () => {

            ZosmfRestClient.putExpectString = jest.fn(async () => {
                return "";
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(PRETEND_SESSION, wfKey, null, null, null, undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY,
                [Headers.APPLICATION_JSON], {});
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual("");
        });
        it("Should succeed with all optional variables.", async () => {

            ZosmfRestClient.putExpectString = jest.fn(async () => {
                return "";
            });

            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(PRETEND_SESSION, wfKey, conflict, step, subsequet);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            const data: IStartWorkflow = {
                resolveConflictByUsing: conflict,
                stepName: step,
                performSubsequent: subsequet
            };
            expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledTimes(1);
            expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY,
                [Headers.APPLICATION_JSON], data);
            expectZosmfResponseSucceeded(response, error);
            expect(response).toEqual("");
        });
    });
    describe("Failing tests.", () => {
        it("should throw an error if the session parameter is undefined", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(undefined, wfKey);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSession.message);
        });
        it("should throw an error if the workflowKey parameter is undefined", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(PRETEND_SESSION, undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowKey.message);
        });
        it("Should throw error if workflowKey is empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(PRETEND_SESSION, "");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noWorkflowKey.message);
        });
        it("Should throw error if zOSMF version is empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await StartWorkflow.startWorkflow(PRETEND_SESSION, wfKey, null, null, null,"");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });
    });
});
