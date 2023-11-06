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

import { ZosmfRestClient, nozOSMFVersion } from "@zowe/core-for-zowe-sdk";
import { Session, ImperativeError, Imperative, Headers } from "@zowe/core-for-zowe-sdk";
import { IPerformActionResponse, noActionName, noInstanceId, noSessionProvisioning,
    PerformAction, ProvisioningConstants } from "../../src";


const instanceId: string = "1234567_abcde";
const actionName: string = "status";

let RESOURCES_QUERY: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/scr/${instanceId}`;
RESOURCES_QUERY += `/${ProvisioningConstants.ACTIONS_RESOURCES}/${actionName}`;

let responseUri: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/scr/${instanceId}`;
responseUri += `/${ProvisioningConstants.ACTIONS_RESOURCES}/1234_abcd`;

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const ZOSMF_RESPONSE: IPerformActionResponse = {
    "action-id": "1234_abcd",
    "action-uri": `/zosmf/provisioning/rest/1.0/scr/${instanceId}/actions/1234_abcd`
};

function expectZosmfResponseSucceeded(response: IPerformActionResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IPerformActionResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}


describe("PerformAction getResourcesQuery", () => {
    it("should successfully build resources query from passed parameters", () => {
        const resourcesQuery: string = PerformAction.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, instanceId, actionName);
        Imperative.console.info(`Generated query ${resourcesQuery}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(RESOURCES_QUERY);
    });
});

describe("PerformAction doProvisioningActionCommon", () => {

    it("should succeed with all correct parameters", async () => {
        (ZosmfRestClient.postExpectJSON as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId, actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, RESOURCES_QUERY, [Headers.APPLICATION_JSON]);
        expectZosmfResponseSucceeded(response, error);
        expect(ZOSMF_RESPONSE["action-uri"]).toEqual(responseUri);
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(undefined, ProvisioningConstants.ZOSMF_VERSION, instanceId, actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(PRETEND_SESSION, undefined, instanceId, actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(PRETEND_SESSION, "", instanceId, actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the instance-id parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined, actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should throw an error if the instance-id parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, "", actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should throw an error if the action name parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId, undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noActionName.message);
    });

    it("should throw an error if the action name parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId, "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noActionName.message);
    });
});

