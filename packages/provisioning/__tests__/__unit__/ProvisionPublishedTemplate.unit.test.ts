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

import { ZosmfRestClient } from "@zowe/rest-for-zowe-sdk";
import { Session, ImperativeError, Imperative } from "@zowe/imperative";
import { ProvisionPublishedTemplate, IProvisionTemplateResponse, noSessionProvisioning, noTemplateName, nozOSMFVersion,
        ProvisioningConstants, IProvisionOptionals, ProvisioningService, noAccountInfo } from "../../../provisioning";


const templateName: string = "1234567_abcde";
const inputProperties: string = "name=CSQ_MQ_SSID,value=ZCT1";
const domainName: string = "domain-name1";
const tenantName: string = "tenant-name1";
const accountInfo: string = "DEFAULT";


let RESOURCES_QUERY: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/`;
RESOURCES_QUERY += `${ProvisioningConstants.TEMPLATES_RESOURCES}/${templateName}/`;
RESOURCES_QUERY += `${ProvisioningConstants.ACTIONS_RESOURCES}/${ProvisioningConstants.RESOURCE_PROVISION_RUN}`;


const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const PRETEND_INPUT_PARMS: IProvisionOptionals = ProvisioningService.checkForPassedOptionalParms(
    inputProperties,
    null,
    domainName,
    tenantName
);

const PRETEND_ZOSMF_RESPONSE: IProvisionTemplateResponse = {
    "registry-info": {
        "object-name": "obj_name1",
        "object-id": "objidunique1",
        "object-uri": "/zosmf/provisioning/rest/1.0/scr/objidunique1",
        "external-name": "some_name1",
        "system-nickname": "DUMBNODE"
    },
    "workflow-info": {
        workflowKey: "workflowkey1234",
        workflowDescription: "Procedure to provision a MQ for zOS Queue Manager",
        workflowID: "ProvisionQueueManager",
        workflowVersion: "1.0.1",
        vendor: "IBM"
    },
    "system-nickname": "DUMBNODE"
};

function expectZosmfResponseSucceeded(response: IProvisionTemplateResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IProvisionTemplateResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("ProvisionPublishedTemplate", () => {

    it("provisionTemplate should succeed without passed optional parameters", async () => {
        (ZosmfRestClient.postExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(PRETEND_ZOSMF_RESPONSE);
                });
            });
        });

        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplate(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
    });

    it("provisionTemplate should succeed with passed optional parameters", async () => {
        (ZosmfRestClient.postExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(PRETEND_ZOSMF_RESPONSE);
                });
            });
        });

        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplate(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                templateName, PRETEND_INPUT_PARMS);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
    });

    it("provisionTemplate should throw an error if the session parameter is undefined", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplate(undefined, ProvisioningConstants.ZOSMF_VERSION, templateName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("provisionTemplate should throw an error if the z/OSMF version parameter is undefined", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplate(PRETEND_SESSION, undefined, templateName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("provisionTemplate should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplate(PRETEND_SESSION, "", templateName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("provisionTemplate should throw an error if the template-name parameter is undefined", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplate(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noTemplateName.message);
    });

    it("provisionTemplate should throw an error if the template-name parameter is an empty string", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplate(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION, "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noTemplateName.message);
    });

    it("provisionTemplateCommon should succeed with all correct parameters", async () => {
        (ZosmfRestClient.postExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(PRETEND_ZOSMF_RESPONSE);
                });
            });
        });

        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplateCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                templateName, accountInfo);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);
    });

    it("provisionTemplateCommon should throw an error if the session parameter is undefined", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplateCommon(undefined, ProvisioningConstants.ZOSMF_VERSION,
                templateName, accountInfo);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("provisionTemplateCommon should throw an error if the z/OSMF version parameter is undefined", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplateCommon(PRETEND_SESSION, undefined,
                templateName, accountInfo);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("provisionTemplateCommon should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplateCommon(PRETEND_SESSION, "",
                templateName, accountInfo);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("provisionTemplateCommon should throw an error if the template-name parameter is undefined", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplateCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                undefined, accountInfo);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noTemplateName.message);
    });

    it("provisionTemplateCommon should throw an error if the template-name parameter is an empty string", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplateCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                "", accountInfo);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noTemplateName.message);
    });

    it("provisionTemplateCommon should throw an error if the account-info parameter is undefined", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplateCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                templateName, undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noAccountInfo.message);
    });

    it("provisionTemplateCommon should throw an error if the account-info parameter is an empty string", async () => {
        let response: IProvisionTemplateResponse;
        let error: ImperativeError;
        try {
            response = await ProvisionPublishedTemplate.provisionTemplateCommon(PRETEND_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                templateName, "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noAccountInfo.message);
    });

});
