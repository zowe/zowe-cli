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

import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import {
    IProvisionTemplateResponse,
    noAccountInfo,
    noSessionProvisioning,
    noTemplateName,
    nozOSMFVersion,
    ProvisioningConstants,
    ProvisionPublishedTemplate,
} from "../../../";
import { ProvisioningTestUtils } from "../../__resources__/api/ProvisioningTestUtils";

const MAX_TIMEOUT_TIME: number = 3600000;

// If you have a published template which requires account-info, change it here
// in most cases account-info is optional
const ACCOUNT_NUMBER: string = "1111111111";

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;

let REAL_SESSION: Session;

let templateName: string;
let instanceName: string;

const OBJECT_URI: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/${ProvisioningConstants.INSTANCES_RESOURCE}/`;

describe("ProvisionPublishedTemplate (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_provision_template"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        templateName = testEnvironment.systemTestProperties.provisioning.templateName;
        instanceName = testEnvironment.systemTestProperties.provisioning.instanceName;
    });

    describe("ProvisionPublishedTemplate.provisionTemplateCommon", () => {
        afterAll(async () => {
            await TestEnvironment.cleanUp(testEnvironment);
        });

        it("should succeed with all correct parameters", async () => {
            let response: IProvisionTemplateResponse;
            let instanceID: string;
            let error: ImperativeError;
            let OBJECT_URI_RESPONSE: string;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    templateName, ACCOUNT_NUMBER);
                instanceID = response["registry-info"]["object-id"];
                Imperative.console.info(`Response ${response}`);
                OBJECT_URI_RESPONSE = OBJECT_URI + instanceID;
                // Delete the provisioned instance
                await ProvisioningTestUtils.removeProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
            expect(response["registry-info"]["object-uri"]).toEqual(OBJECT_URI_RESPONSE);
        }, MAX_TIMEOUT_TIME);

        it("should throw an error if the session parameter is undefined", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(undefined, ProvisioningConstants.ZOSMF_VERSION,
                    templateName, null);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
        });

        it("should throw an error if the z/OSMF version parameter is undefined", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, undefined,
                    templateName, null);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });

        it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, "",
                    templateName, null);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });

        it("should throw an error if the template-name parameter is undefined", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    undefined, null);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noTemplateName.message);
        });

        it("should throw an error if the template-name parameter is an empty string", async () => {
            let response: IProvisionTemplateResponse;
            let error: ImperativeError;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    "", null);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noTemplateName.message);
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
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noAccountInfo.message);
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
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noAccountInfo.message);
        });

    });

    describe("ProvisionPublishedTemplate.provisionTemplate", () => {
        afterAll(async () => {
            await TestEnvironment.cleanUp(testEnvironment);
        });

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
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
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
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
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
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
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
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noTemplateName.message);
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
            ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noTemplateName.message);
        });

        it("should succeed with no optional parameters", async () => {
            let response: IProvisionTemplateResponse;
            let instanceID: string;
            let error: ImperativeError;
            let OBJECT_URI_RESPONSE: string;
            try {
                response = await ProvisionPublishedTemplate.provisionTemplate(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    templateName, null);
                instanceID = response["registry-info"]["object-id"];
                Imperative.console.info(`Response ${response}`);
                OBJECT_URI_RESPONSE = OBJECT_URI + instanceID;
                // Delete the provisioned instance
                await ProvisioningTestUtils.removeProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
            expect(response["registry-info"]["object-uri"]).toEqual(OBJECT_URI_RESPONSE);
        }, MAX_TIMEOUT_TIME);
    });
});

