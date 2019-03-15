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
import { ZosmfRestClient } from "../../../rest";
import { Session, ImperativeError, Imperative } from "@zowe/imperative";
import { IProvisionedInstanceVariables, noInstanceId, ProvisioningConstants,
        noSessionProvisioning, nozOSMFVersion, ListInstanceVariables } from "../../../provisioning";

const instanceId: string = "123456_abcd1";

let PRETEND_RESOURCES_QUERY: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/`;
PRETEND_RESOURCES_QUERY += `${ProvisioningConstants.INSTANCES_RESOURCE}/${instanceId}/${ProvisioningConstants.VARIABLES_RESOURCE}`;

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const ZOSMF_RESPONSE: IProvisionedInstanceVariables = {
    variables: [
        {
            "name": "INS",
            "value": "Instructions",
            "visibility": "public",
            "update-registry": "false"
        },
        {
            "name": "INS2",
            "value": "Instructions2",
            "visibility": "private",
            "update-registry": "false"
        }
    ]
};

function expectZosmfResponseFailed(response: IProvisionedInstanceVariables, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("ListInstanceVariables getResourcesQuery", () => {

    it("should successfully build a query from passed parameters", () => {
        const resourcesQuery = ListInstanceVariables.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, instanceId);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(PRETEND_RESOURCES_QUERY);
    });
});

describe("ListInstanceVariables listVariablesCommon", () => {

    it("should succeed and return list of variables", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IProvisionedInstanceVariables;
        try {
            response = await ListInstanceVariables.listVariablesCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, PRETEND_RESOURCES_QUERY);
        expect(response.variables.length).toBeGreaterThan(1);
        expect(response.variables[0].name).toEqual("INS");
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstanceVariables;
        try {
            response = await ListInstanceVariables.listVariablesCommon(undefined, ProvisioningConstants.ZOSMF_VERSION, instanceId);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstanceVariables;
        try {
            response = await ListInstanceVariables.listVariablesCommon(PRETEND_SESSION, undefined, instanceId);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstanceVariables;
        try {
            response = await ListInstanceVariables.listVariablesCommon(PRETEND_SESSION, "", instanceId);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the instance-id parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstanceVariables;
        try {
            response = await ListInstanceVariables.listVariablesCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should throw an error if instance-id parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstanceVariables;
        try {
            response = await ListInstanceVariables.listVariablesCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, "");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });
});
