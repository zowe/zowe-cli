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
import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { IProvisionedInstances, ListRegistryInstances, noSessionProvisioning, nozOSMFVersion, ProvisioningConstants } from "../../../provisioning";

const type: string = "DB2";
const externalName: string = "DB2FULL";
const NO_FILTERS_QUERY: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/scr`;
const FILTER_BY_TYPE_QUERY: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/scr?type=${type}`;
const FILTER_BY_EXTERNAL_NAME: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/scr?external-name=${externalName}`;
const FILTER_BY_EXT_NAME_AND_TYPE: string =
    `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/scr?type=${type}&external-name=${externalName}`;
const FILTER_BY_EXT_NAME_AND_TYPE_CICS: string =
    `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/scr?type=CICS&external-name=CICSFULL2`;

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const ZOSMF_RESPONSE: IProvisionedInstances = {
    "scr-list": [
        {
            "system": "system1",
            "sysplex": "system1",
            "type": "DB2",
            "vendor": "IBM",
            "version": "B1",
            "owner": "owner1",
            "provider": "provider1",
            "description": "The software registry entry for the DB2 instance.",
            "state": "provisioned",
            "object-id": "1234567_id",
            "object-name": "DB2FULL_FULL",
            "external-name": "DB2FULL",
            "registry-type": "general",
            "catalog-object-id": null,
            "catalog-object-name": null,
            "created-time": "2017-10-24T11:07:53.646Z",
            "last-modified-time": "2017-10-24T11:07:53.646Z",
            "created-by-user": "user1",
            "last-modified-by-user": "user1",
            "last-action-name": null,
            "last-action-object-id": null,
            "last-action-state": null,
            "user-data-id": null,
            "tenant-id": null,
            "tenant-name": "",
            "domain-id": "",
            "domain-name": "",
            "system-nickname": "",
        },
        {
            "system": "system2",
            "sysplex": "system2",
            "type": "CICS",
            "vendor": "IBM",
            "version": "B1",
            "owner": "owner2",
            "provider": "provider2",
            "description": "The software registry entry for the DB2 instance.",
            "state": "provisioned",
            "object-id": "1234567_id_2",
            "object-name": "CICS_FULL2",
            "external-name": "CICSFULL2",
            "registry-type": "general",
            "catalog-object-id": null,
            "catalog-object-name": null,
            "created-time": "2017-10-24T11:07:53.646Z",
            "last-modified-time": "2017-10-24T11:07:53.646Z",
            "created-by-user": "user2",
            "last-modified-by-user": "user2",
            "last-action-name": null,
            "last-action-object-id": null,
            "last-action-state": null,
            "user-data-id": null,
            "tenant-id": null,
            "tenant-name": "",
            "domain-id": "",
            "domain-name": "",
            "system-nickname": "",
        }
    ]
};

const ZOSMF_RESPONSE_DB2_TYPE: IProvisionedInstances = {"scr-list": [ZOSMF_RESPONSE["scr-list"][0]]};
const ZOSMF_RESPONSE_CICS_TYPE: IProvisionedInstances = {"scr-list": [ZOSMF_RESPONSE["scr-list"][1]]};


function expectZosmfResponseSucceeded(response: IProvisionedInstances, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IProvisionedInstances, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("ListRegistryInstances getResourcesQuery", () => {

    it("should return query without filters", () => {
        const resourcesQuery = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION);
        Imperative.console.info(`Generated query: ${resourcesQuery}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(NO_FILTERS_QUERY);
    });

    it("should return query with 'type' filter", () => {
        const resourcesQuery = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, type);
        Imperative.console.info(`Generated query: ${resourcesQuery}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(FILTER_BY_TYPE_QUERY);
    });

    it("should return query with 'external-name' filter", () => {
        const resourcesQuery = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, undefined, externalName);
        Imperative.console.info(`Generated query: ${resourcesQuery}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(FILTER_BY_EXTERNAL_NAME);
    });

    it("should return query with 'external-name' and 'type' filters", () => {
        const resourcesQuery = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, type, externalName);
        Imperative.console.info(`Generated query: ${resourcesQuery}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(FILTER_BY_EXT_NAME_AND_TYPE);
    });
});

describe("ListRegistryInstances listRegistryCommon", () => {

    it("should succeed and return list of provisioned instances", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listRegistryCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, null);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, NO_FILTERS_QUERY);
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toEqual(2);
        expect(response).toEqual(ZOSMF_RESPONSE);
    });

    it("should succeed and return list of instances filtered by DB2 type", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE_DB2_TYPE);
                });
            });
        });

        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listRegistryCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, FILTER_BY_TYPE_QUERY);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, FILTER_BY_TYPE_QUERY);
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toEqual(1);
        expect(response["scr-list"][0].type).toEqual("DB2");
        expect(response).toEqual(ZOSMF_RESPONSE_DB2_TYPE);
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listRegistryCommon(undefined, ProvisioningConstants.ZOSMF_VERSION);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listRegistryCommon(PRETEND_SESSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listRegistryCommon(PRETEND_SESSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });
});

describe("ListRegistryInstances listFilteredRegistry", () => {

    it("should succeed and return list of instances filtered by 'type'", async () => {
        (ListRegistryInstances.listRegistryCommon as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE_DB2_TYPE);
                });
            });
        });

        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listFilteredRegistry(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, type, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ListRegistryInstances.listRegistryCommon as any)).toHaveBeenCalledTimes(1);
        expect((ListRegistryInstances.listRegistryCommon as any)).toHaveBeenCalledWith(PRETEND_SESSION,
            ProvisioningConstants.ZOSMF_VERSION, FILTER_BY_TYPE_QUERY);
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toEqual(1);
        expect(response["scr-list"][0].type).toEqual("DB2");
        expect(response).toEqual(ZOSMF_RESPONSE_DB2_TYPE);
    });

    it("should succeed and return list of instances filtered by 'external-name'", async () => {
        (ListRegistryInstances.listRegistryCommon as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE_DB2_TYPE);
                });
            });
        });

        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listFilteredRegistry(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, type, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ListRegistryInstances.listRegistryCommon as any)).toHaveBeenCalledTimes(1);
        expect((ListRegistryInstances.listRegistryCommon as any)).toHaveBeenCalledWith(PRETEND_SESSION,
            ProvisioningConstants.ZOSMF_VERSION, FILTER_BY_TYPE_QUERY);
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toEqual(1);
        expect(response["scr-list"][0]["external-name"]).toEqual(externalName);
        expect(response).toEqual(ZOSMF_RESPONSE_DB2_TYPE);
    });

    it("should succeed and return list of templates filtered by 'type' and 'external-name'", async () => {
        (ListRegistryInstances.listRegistryCommon as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE_CICS_TYPE);
                });
            });
        });

        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listFilteredRegistry(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, "CICS", "CICSFULL2");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ListRegistryInstances.listRegistryCommon as any)).toHaveBeenCalledTimes(1);
        expect((ListRegistryInstances.listRegistryCommon as any))
            .toHaveBeenCalledWith(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, FILTER_BY_EXT_NAME_AND_TYPE_CICS);
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toEqual(1);
        expect(response["scr-list"][0].type).toEqual("CICS");
        expect(response["scr-list"][0]["external-name"]).toEqual("CICSFULL2");
        expect(response).toEqual(ZOSMF_RESPONSE_CICS_TYPE);
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listFilteredRegistry(undefined, ProvisioningConstants.ZOSMF_VERSION, "CICS", "CICSFULL2");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listFilteredRegistry(PRETEND_SESSION, undefined, "CICS", "CICSFULL2");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstances;
        try {
            response = await ListRegistryInstances.listFilteredRegistry(PRETEND_SESSION, undefined, "CICS", "CICSFULL2");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });
});

