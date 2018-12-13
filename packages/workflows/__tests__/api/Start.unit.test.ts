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
import { StartWorkflow } from "../../../workflows";
import { WorkflowConstants, noSession, noWorkflowName, noWorkflowKey } from "../../src/api/WorkflowConstants";

const wfKey = "1234567_abcde";

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

    it("Successfull call returns 201 - no message. Test just with workflow key, name is different API", async () => {

        (ZosmfRestClient.putExpectString as any) = jest.fn<string>(() => {
            return "";
        });

        let error: ImperativeError;
        let response: any;
        try {
            response = await StartWorkflow.startWorkflow(PRETEND_SESSION, null, wfKey);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [Headers.APPLICATION_JSON], { });
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual("");
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await StartWorkflow.startWorkflow(undefined, null, wfKey);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noSession.message);
    });
    it("If workflow key is undefined, will look for wfName. Should throw an error if wfName is undefined.", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await StartWorkflow.startWorkflow(PRETEND_SESSION, undefined, undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noWorkflowName.message);
    });
    it("Should throw wfKey error if workflow key is empty string.", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await StartWorkflow.startWorkflow(PRETEND_SESSION, undefined, "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noWorkflowKey.message);
    });
    it("Never checks wfName if wfKey is not null or undefined. Will behave as previous " +
       "- throw wfKey error if workflow key is empty string.", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await StartWorkflow.startWorkflow(PRETEND_SESSION, "", "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noWorkflowKey.message);
    });
    it("If wfKey is undefined, will look for wfName. Should throw an error if wfName is empty string.", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await StartWorkflow.startWorkflow(PRETEND_SESSION, "", undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noWorkflowName.message);
    });
});
