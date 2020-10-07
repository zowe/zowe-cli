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

import { inspect } from "util";
import { ZosmfRestClient, nozOSMFVersion } from "@zowe/core-for-zowe-sdk";
import { Session, ImperativeError, Imperative } from "@zowe/imperative";
import { IProvisionedInstance, noInstanceId, ProvisioningConstants,
        noSessionProvisioning, ListInstanceInfo } from "../../";

const instanceId: string = "123456";
const RESOURCES_QUERY: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/scr/${instanceId}`;

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const ZOSMF_RESPONSE: IProvisionedInstance = {
    "type": "DB2",
    "system": "SY1",
    "sysplex": "PLEX1",
    "vendor": "IBM",
    "version": "V10",
    "description": "DB2 for test",
    "owner": "owner1",
    "provider": "provider1",
    "state": "provisioned",
    "variables": [],
    "actions": [],
    "email": "null",
    "ssin": "DB2000",
    "object-id": "123456",
    "object-name": "DB2_1",
    "object-uri": "/zosmf/provisioning/rest/1.0/scr/123456",
    "registry-type": "catalog",
    "external-name": "DB2_DB2000",
    "system-nickname": "SY1",
    "catalog-object-id": "7e147191-8519-402d-a31a-59e978e5a0ee",
    "catalog-object-name": "A1",
    "workflow-key": "key1",
    "workflow-clean-after-provisioned": null,
    "jobs-disposition": null,
    "created-time": "2017-04-17T14:57:30.322Z",
    "last-modified-time": "2017-04-17T14:57:30.450Z",
    "created-by-user": "user1",
    "last-modified-by-user": "user1",
    "last-action-name": null,
    "last-action-object-id": null,
    "last-action-state": null,
    "user-data": "my data",
    "user-data-id": "usrid1",
    "tenant-id": "IYU000",
    "tenant-name": "default",
    "domain-id": "IYU0",
    "domain-name": "default",
    "job-statement": null,
    "account-info": null,
    "runAsUser-audit": true,
    "workflow-start-time": "2017-04-17T14:52:03.537Z",
    "workflow-stop-time": "2017-04-17T14:52:03.568Z"
};

function expectZosmfResponseSucceeded(response: any, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: any, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("ListInstanceInfo listInstanceCommon", () => {

    it("should succeed with all correctly provided parameters", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response;
        try {
            response = await ListInstanceInfo.listInstanceCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, RESOURCES_QUERY);
        expectZosmfResponseSucceeded(response, error);
        expect(response["object-id"]).toEqual(instanceId);
        expect(response["object-name"]).toEqual("DB2_1");
        expect(response).toEqual(ZOSMF_RESPONSE);
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response;
        try {
            response = await ListInstanceInfo.listInstanceCommon(undefined, ProvisioningConstants.ZOSMF_VERSION, instanceId);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version is undefined", async () => {
        let error: ImperativeError;
        let response;
        try {
            response = await ListInstanceInfo.listInstanceCommon(PRETEND_SESSION, undefined, instanceId);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the instance-id name is undefined", async () => {
        let error: ImperativeError;
        let response;
        try {
            response = await ListInstanceInfo.listInstanceCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should throw an error if the instance-id name is empty string", async () => {
        let error: ImperativeError;
        let response;
        try {
            response = await ListInstanceInfo.listInstanceCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, "");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });
});
