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

import { Session, ImperativeError, Imperative } from "@zowe/imperative";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import {
    IPublishedTemplateInfo,
    ListTemplateInfo,
    noSessionProvisioning,
    noTemplateName,
    nozOSMFVersion,
    ProvisioningConstants
} from "../../../";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ProvisioningTestUtils } from "../../__resources__/utils/ProvisioningTestUtils";

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;

let TEMPLATE_NAME: string;
let REAL_SESSION: Session;

describe("ListTemplateInfo (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_list_template-info"
        });
        TEMPLATE_NAME = testEnvironment.systemTestProperties.provisioning.templateName;
        Imperative.console.info(`Template name: ${TEMPLATE_NAME}`);
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should succeed with correct parameters and return a response from z/OSMF", async () => {
        let response: IPublishedTemplateInfo;
        let error: ImperativeError;

        try {
            response = await ListTemplateInfo.listTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, TEMPLATE_NAME);
            Imperative.console.info(`Response ${response.name}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response.name).toEqual(TEMPLATE_NAME);
        expect(response.state).toEqual("published");
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("should fail if the session is undefined", async () => {
        let response: IPublishedTemplateInfo;
        let error: ImperativeError;
        try {
            response = await ListTemplateInfo.listTemplateCommon(undefined, ProvisioningConstants.ZOSMF_VERSION, TEMPLATE_NAME);
            Imperative.console.info(`Response ${response.name}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should fail and thrown an error if the zosmf version is undefined", async () => {
        let response: IPublishedTemplateInfo;
        let error: ImperativeError;
        try {
            response = await ListTemplateInfo.listTemplateCommon(REAL_SESSION, undefined, TEMPLATE_NAME);
            Imperative.console.info(`Response ${response.name}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should fail and throw an error if the z/OSMF version is an empty string", async () => {
        let response: IPublishedTemplateInfo;
        let error: ImperativeError;
        try {
            response = await ListTemplateInfo.listTemplateCommon(REAL_SESSION, "", TEMPLATE_NAME);
            Imperative.console.info(`Response ${response.name}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should fail and throw an error if the template name is undefined", async () => {
        let response: IPublishedTemplateInfo;
        let error: ImperativeError;
        try {
            response = await ListTemplateInfo.listTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined);
            Imperative.console.info(`Response ${response.name}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noTemplateName.message);
    });

    it("should fail and throw an error if the template name is an empty string", async () => {
        let response: IPublishedTemplateInfo;
        let error: ImperativeError;
        try {
            response = await ListTemplateInfo.listTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, "");
            Imperative.console.info(`Response ${response.name}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noTemplateName.message);
    });
});
