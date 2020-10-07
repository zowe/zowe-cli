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
import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { IPublishedTemplates, ListCatalogTemplates, noSessionProvisioning, ProvisioningConstants } from "../../";

const RESOURCES_QUERY: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/psc/`;

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const ZOSMF_RESPONSE: any = {
    "psc-list": [
        {
            "name": "TEMPLATE_NAME1",
            "version": "1",
            "owner": "owner_1",
            "state": "published",
            "description": "Description of the published template",
            "generated-name": "TEMPLATE_NAME1",
            "object-id": "object_id_1",
            "base-object-id": "base_object_id_1",
            "domain-name": "default",
            "action-definition-file": "definition/def.xml",
            "software-id": "777777",
            "software-name": "Soft for z/OS",
            "software-type": "soft_type",
            "software-version": "V1.0.0",
            "workflow-definition-file": "definition/prov.xml",
            "workflow-id": "ProvisionQueueManager",
            "workflow-vendor": "IBM",
            "workflow-version": "1.0.0",
            "workflow-variable-input-file": "definition/workflow_vars.properties",
            "create-time": "2017-11-18T20:00:43.504Z",
            "created-by-user": "domadmin",
            "last-modified-by-user": "domadmin",
            "last-modified-time": "2016-11-18T20:28:43.951Z",
            "template-type": "standard",
            "composite-parents": []
        },
        {
            "name": "TEMPLATE_NAME2",
            "version": "1",
            "owner": "owner_2",
            "state": "published",
            "description": "Description of the published template",
            "generated-name": "TEMPLATE_NAME2",
            "object-id": "object_id_2",
            "base-object-id": "base_object_id_2",
            "domain-name": "default",
            "action-definition-file": "definition/def.xml",
            "software-id": "777777",
            "software-name": "Soft for z/OS",
            "software-type": "soft_type",
            "software-version": "V1.0.0",
            "workflow-definition-file": "definition/prov.xml",
            "workflow-id": "ProvisionQueueManager",
            "workflow-vendor": "IBM",
            "workflow-version": "1.0.0",
            "workflow-variable-input-file": "definition/workflow_vars.properties",
            "create-time": "2017-11-18T20:00:43.504Z",
            "created-by-user": "domadmin",
            "last-modified-by-user": "domadmin",
            "last-modified-time": "2016-11-18T20:28:43.951Z",
            "template-type": "standard",
            "composite-parents": []
        }
    ]
};

function expectZosmfResponseSucceeded(response: IPublishedTemplates, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IPublishedTemplates, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("ListCatalogTemplates listCatalogCommon", () => {
    it("should succeed with all correctly provided parameters", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IPublishedTemplates;
        try {
            response = await ListCatalogTemplates.listCatalogCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, RESOURCES_QUERY);
        expectZosmfResponseSucceeded(response, error);
        expect(response["psc-list"].length).toEqual(2);
        expect(response).toEqual(ZOSMF_RESPONSE);
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPublishedTemplates;
        try {
            response = await ListCatalogTemplates.listCatalogCommon(undefined, ProvisioningConstants.ZOSMF_VERSION);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPublishedTemplates;
        try {
            response = await ListCatalogTemplates.listCatalogCommon(PRETEND_SESSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IPublishedTemplates;
        try {
            response = await ListCatalogTemplates.listCatalogCommon(PRETEND_SESSION, "");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });
});

