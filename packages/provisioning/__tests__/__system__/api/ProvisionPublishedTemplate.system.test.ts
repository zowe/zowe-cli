/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import {
    IProvisionedInstances,
    IProvisionTemplateResponse,
    ListRegistryInstances,
    ListInstanceInfo,
    noSessionProvisioning,
    noTemplateName,
    nozOSMFVersion,
    PerformAction,
    ProvisioningConstants,
    ProvisionPublishedTemplate,
    IProvisionOptionals,
    noAccountInfo, DeleteInstance,
} from "../../../../provisioning";

const MAX_TIMEOUT_NUMBER: number = 3600000;
const SLEEP_TIME: number = 10000;

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;

let REAL_SESSION: Session;

let templateName: string;
let instanceName: string;
let accountNumber: string;

const inputProperties: IProvisionOptionals = {
    "input-variables": null,
    "domain-name": null,
    "tenant-name": null,
    "user-data-id": null,
    "account-info": null,
    "user-data": null,
    "systems-nicknames": null
};

const OBJECT_URI: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/${ProvisioningConstants.INSTANCES_RESOURCE}/`;


function expectZosmfResponseSucceeded(response: IProvisionTemplateResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IProvisionTemplateResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function cleanUpActiveInstances() {
    let registryInstances: IProvisionedInstances;
    let error: ImperativeError;
    try {
        registryInstances = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION);
        for (const instance of registryInstances["scr-list"]) {
            let instanceState: string;
            let instanceId: string;
            if (instance["external-name"].includes(instanceName)) {
                instanceId = instance["object-id"];
                if (instance.state === "being-provisioned") {
                    instanceId = instance["object-id"];
                    instanceState = instance.state;
                    while (instanceState === "being-provisioned") {
                        await sleep(SLEEP_TIME);
                        instanceState = (await ListInstanceInfo.listInstanceCommon(REAL_SESSION,
                            ProvisioningConstants.ZOSMF_VERSION, instanceId)).state;
                        Imperative.console.info(`Instance state is ${instanceState}`);
                    }
                    Imperative.console.info(`Instance state is ${instanceState}`);
                    await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                        instanceId, "deprovision");
                    instanceState = "being-deprovisioned";
                    while (instanceState === "being-deprovisioned") {
                        await sleep(SLEEP_TIME);
                        instanceState = (await ListInstanceInfo.listInstanceCommon(REAL_SESSION,
                            ProvisioningConstants.ZOSMF_VERSION, instanceId)).state;
                        Imperative.console.info(`Instance state is ${instanceState}`);
                    }
                    Imperative.console.info(`Instance state is ${instanceState}`);
                    await DeleteInstance.deleteDeprovisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId);

                } else {
                    await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                        instanceId, "deprovision");
                }
            }
        }

    } catch (thrownError) {
        error = thrownError;
        Imperative.console.info(`Error ${error}`);
    }
}

describe("ProvisionPublishedTemplate (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_provision_template"
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        templateName = testEnvironment.systemTestProperties.provisioning.templateName;
        instanceName = testEnvironment.systemTestProperties.provisioning.instanceName;
        accountNumber = defaultSystem.tso.account;
    });

    describe("ProvisionPublishedTemplate.provisionTemplateCommon", () => {
        afterAll(async () => {
            await TestEnvironment.cleanUp(testEnvironment);
            await cleanUpActiveInstances();
        }, MAX_TIMEOUT_NUMBER);

        it("should succeed with all correct parameters", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            let OBJECT_URI_RESPONSE: string;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    templateName, accountNumber);
                Imperative.console.info(`Response ${response}`);
                OBJECT_URI_RESPONSE =  OBJECT_URI + response["registry-info"]["object-id"];
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response["registry-info"]["object-uri"]).toEqual(OBJECT_URI_RESPONSE);
        }, MAX_TIMEOUT_NUMBER);

        it("should throw an error if the session parameter is undefined", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(undefined, ProvisioningConstants.ZOSMF_VERSION,
                    templateName, accountNumber);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
        });

        it("should throw an error if the z/OSMF version parameter is undefined", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, undefined,
                    templateName, accountNumber);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });

        it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, "",
                    templateName, accountNumber);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });

        it("should throw an error if the template-name parameter is undefined", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    undefined, accountNumber);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noTemplateName.message);
        });

        it("should throw an error if the template-name parameter is an empty string", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    "", accountNumber);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noTemplateName.message);
        });

        it("should throw an error if the account-info parameter is undefined", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    templateName, undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noAccountInfo.message);
        });

        it("should throw an error if the account-info parameter is an empty string", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    templateName, "");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noAccountInfo.message);
        });

    });

    describe("ProvisionPublishedTemplate.provisionTemplate", () => {
        afterAll(async () => {
            await TestEnvironment.cleanUp(testEnvironment);
            await cleanUpActiveInstances();
        }, MAX_TIMEOUT_NUMBER);

        it("should throw an error if the session parameter is undefined", async () => {
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

        it("should throw an error if the z/OSMF version parameter is undefined", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplate(REAL_SESSION, undefined, templateName);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });

        it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplate(REAL_SESSION, "", templateName);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });

        it("should throw an error if the template-name parameter is undefined", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplate(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noTemplateName.message);
        });

        it("should throw an error if the template-name parameter is an empty string", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplate(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, "");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noTemplateName.message);
        });

        it("should succeed with passed optional parameters", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            let OBJECT_URI_RESPONSE: string;
            try {
                inputProperties["account-info"] = accountNumber;
                response = await ProvisionPublishedTemplate.provisionTemplate(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    templateName, inputProperties);
                Imperative.console.info(`Response ${response}`);
                OBJECT_URI_RESPONSE = OBJECT_URI + response["registry-info"]["object-id"];
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseSucceeded(response, error);
            expect(response["registry-info"]["object-uri"]).toEqual(OBJECT_URI_RESPONSE);
        }, MAX_TIMEOUT_NUMBER);
    });
});

