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
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import {
    IPerformActionResponse,
    IProvisionedInstance,
    noActionName,
    noInstanceId,
    noSessionProvisioning,
    nozOSMFVersion,
    PerformAction,
    ProvisioningConstants
} from "../../../";
import { ProvisioningTestUtils } from "../../__resources__/utils/ProvisioningTestUtils";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let templateName: string;
let instanceID: string;
let RESPONSE_URI: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/`;
RESPONSE_URI +=`${ProvisioningConstants.INSTANCES_RESOURCE}/`;

describe("PerformAction.doProvisioningActionCommon (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_perform_action"
        });
        templateName = testEnvironment.systemTestProperties.provisioning.templateName;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        let instance: IProvisionedInstance;
        instance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
        instanceID = instance["object-id"];
        Imperative.console.info(`Provisioned instance: ${instance["external-name"]}`);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
        // Delete deprovisioned instance
        await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
    });

    it("should succeed with correct parameters and return a response from z/OSMF", async () => {
        let response: IPerformActionResponse;
        let error: ImperativeError;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                instanceID, ProvisioningTestUtils.ACTION_DEPROV);
            Imperative.console.info(`Response ${response["action-uri"]}`);
            RESPONSE_URI += `${instanceID}/${ProvisioningConstants.ACTIONS_RESOURCES}/${response["action-id"]}`;
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["action-id"]).toBeDefined();
        expect(response["action-uri"]).toBeDefined();
        expect(response["action-uri"]).toEqual(RESPONSE_URI);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(undefined, ProvisioningConstants.ZOSMF_VERSION,
                "1234", ProvisioningTestUtils.ACTION_DEPROV);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, undefined,
                "1234", ProvisioningTestUtils.ACTION_DEPROV);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, "",
                "1234", ProvisioningTestUtils.ACTION_DEPROV);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("throw an error if the instance-id parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                undefined, ProvisioningTestUtils.ACTION_DEPROV);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should throw an error if the instance-id parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                "", ProvisioningTestUtils.ACTION_DEPROV);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should throw an error if the action name parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                "1234", undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noActionName.message);
    });

    it("should throw an error if the action name parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                "1234", "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noActionName.message);
    });
});
