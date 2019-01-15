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
import { DeleteWorkflow } from "../../../workflows";
import { WorkflowConstants, noSession, noWorkflowKey, nozOSMFVersion } from "../../src/api/WorkflowConstants";

const wfKey = "1234567_abcde";

let START_RESOURCE_QUERY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/`;
START_RESOURCE_QUERY += `${WorkflowConstants.WORKFLOW_RESOURCE}/${wfKey}`;


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


describe("Delete workflow", () => {

    it("Successful call returns 204 - No Content.", async () => {

        (ZosmfRestClient.deleteExpectString as any) = jest.fn<string>(() => {
            return "";
        });

        let error: ImperativeError;
        let response: any;
        try {
            response = await DeleteWorkflow.deleteWorkflow(PRETEND_SESSION, wfKey);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect((ZosmfRestClient.deleteExpectString as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.deleteExpectString as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, []);
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual("");
    });
    it("Successful even with zOSMF version undefined (because of default value).", async () => {

        (ZosmfRestClient.deleteExpectString as any) = jest.fn<string>(() => {
            return "";
        });

        let error: ImperativeError;
        let response: any;
        try {
            response = await DeleteWorkflow.deleteWorkflow(PRETEND_SESSION, wfKey, undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect((ZosmfRestClient.deleteExpectString as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.deleteExpectString as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, []);
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual("");
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await DeleteWorkflow.deleteWorkflow(undefined, wfKey);
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
            response = await DeleteWorkflow.deleteWorkflow(PRETEND_SESSION, undefined);
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
            response = await DeleteWorkflow.deleteWorkflow(PRETEND_SESSION, "");
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
            response = await DeleteWorkflow.deleteWorkflow(PRETEND_SESSION, wfKey, "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });
});
