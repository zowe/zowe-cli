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
import { Session, Imperative, ImperativeError } from "@zowe/imperative";
import { ListTemplateInfo, noSessionProvisioning,
        noTemplateName, ProvisioningConstants } from "../../";


const templateName: string = "EXAMPLE_TEMPLATE";
const RESOURCES_QUERY: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/psc/${templateName}`;

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const ZOSMF_RESPONSE_NO_PROMPT_VARS: any = {
    "name": "TEMPLATE_NAME1",
    "version": "1",
    "owner": "owner_1",
    "state": "published",
    "description": "Description of the published template",
    "tenants": [{}],
    "actions": [{}],
    "approvals": [{}],
    "tested": false,
    "generated-name": "TEMPLATE_NAME1",
    "domain-name": "default",
    "action-definition-file": "definition/actions.xml",
    "action-definition-file-original-source": "/users/gg/mqCBA/definition/actions.xml",
    "action-definition-file-original-timestamp": "2016-11-18T20:00:42Z",
    "software-id": "777777",
    "software-name": "Soft for z/OS",
    "software-type": "soft_type",
    "software-version": "V1.0.0",
    "workflow-definition-file": "definition/provision.xml",
    "workflow-definition-file-original-source": "/users/gg/mqCBA/definition/provision.xml",
    "workflow-definition-file-original-timestamp": "2016-11-18T20:03:47Z",
    "workflow-id": "ProvisionQueueManager",
    "workflow-vendor": "IBM",
    "workflow-version": "1.0.1",
    "workflow-variable-input-file": "definition/workflow_vars.properties",
    "workflow-variable-input-file-original-source": "/users/gg/mqCBA/definition/workflow_vars.properties",
    "workflow-variable-input-file-original-timestamp": "2016-11-18T20:00:42Z",
    "at-create-variables": [{}],
    "workflow-clean-after-provisioned": true,
    "security-wf-info": null,
    "create-time": "2016-11-18T20:00:43.504Z",
    "created-by-user": "domadmin",
    "last-modified-by-user": "domadmin",
    "last-modified-time": "2016-11-18T20:04:50.913Z",
    "admin-documentation-file-original-source": "/users/gg/mqCBA/documentation/admin-mqaas_readme.pdf",
    "admin-documentation":
        "/zosmf/provisioning/rest/1.0/scc/5b0c3367-b856-4727-99ac-f9a79c9abf28/documentation/admin",
    "admin-documentation-type": "pdf",
    "consumer-documentation-file-original-source":
        "/users/gg/mqCBA/documentation/consumer-workflow_variables.properties",
    "consumer-documentation":
        "/zosmf/provisioning/rest/1.0/scc/5b0c3367-b856-4727-99ac-f9a79c9abf28/documentation/consumer",
    "consumer-documentation-type": "text",
    "base-object-id": "c0e4d08f-f046-4a79-8a15-6981743d07ed",
    "admin-documentation-mime-type": "application/pdf",
    "consumer-documentation-mime-type": "text/plain"
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

describe("ListTemplateInfo getResourcesQuery", () => {
    it("should successfully generate a query from provided parameters", () => {
        const resourcesQuery = ListTemplateInfo.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, templateName);
        Imperative.console.info(`Generated query: ${resourcesQuery}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(RESOURCES_QUERY);
    });
});

describe("ListTemplateInfo listTemplateCommon", () => {
    it("should succeed with all correctly provided parameters", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE_NO_PROMPT_VARS);
                });
            });
        });

        let error: ImperativeError;
        let response;
        try {
            response = await ListTemplateInfo.listTemplateCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, RESOURCES_QUERY);
        expectZosmfResponseSucceeded(response, error);
        expect(response.name).toEqual(ZOSMF_RESPONSE_NO_PROMPT_VARS.name);
        expect(response).toEqual(ZOSMF_RESPONSE_NO_PROMPT_VARS);
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response;
        try {
            response = await ListTemplateInfo.listTemplateCommon(undefined, ProvisioningConstants.ZOSMF_VERSION, templateName);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if z/OSMF version is undefined", async () => {
        let error: ImperativeError;
        let response;
        try {
            response = await ListTemplateInfo.listTemplateCommon(PRETEND_SESSION, undefined, templateName);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the template name is undefined", async () => {
        let error: ImperativeError;
        let response;
        try {
            response = await ListTemplateInfo.listTemplateCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noTemplateName.message);
    });

    it("should thrown an error if the template name is an empty string", async () => {
        let error: ImperativeError;
        let response;
        try {
            response = await ListTemplateInfo.listTemplateCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, "");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noTemplateName.message);
    });
});
