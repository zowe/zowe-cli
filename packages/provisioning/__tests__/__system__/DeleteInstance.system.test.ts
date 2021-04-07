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
import { nozOSMFVersion } from "@zowe/core-for-zowe-sdk";
import { ITestEnvironment } from "../../../../__tests__/__packages__/ts-cli-test-utils";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import {
    DeleteInstance,
    noInstanceId,
    noSessionProvisioning,
    PerformAction,
    ProvisioningConstants
} from "../../src";
import { ProvisioningTestUtils } from "../__resources__/utils/ProvisioningTestUtils";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let templateName: string;
let instanceID: string;
let REAL_SESSION: Session;

describe("DeleteInstance (system)", () => {
    beforeAll(async () => {
        let instance;

        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_delete_instance"
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        templateName = testEnvironment.systemTestProperties.provisioning.templateName;

        instance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
        Imperative.console.info(`Provisioned instance: ${instance["external-name"]}`);
        instanceID = instance["object-id"];

        // Deprovision the instance
        instance = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            instanceID, ProvisioningTestUtils.ACTION_DEPROV);
        Imperative.console.info(`Deprovision of the instance started, action-id: ${instance["action-id"]}`);
        // Wait until instance state is 'deprovisioned'
        instance = await ProvisioningTestUtils.waitInstanceState(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            instanceID, ProvisioningTestUtils.STATE_DEPROV);
        Imperative.console.info(`Deprovisioned instance: ${instance["external-name"]}`);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });


    it("should succeed with correct parameters and return an empty response from z/OSMF", async () => {
        let response: any;
        let error: ImperativeError;
        try {
            response = await DeleteInstance.deleteDeprovisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
            Imperative.console.info(`Instance ${instanceID} was removed`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(response).toEqual("");

    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await DeleteInstance.deleteDeprovisionedInstance(undefined, ProvisioningConstants.ZOSMF_VERSION, "1234");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await DeleteInstance.deleteDeprovisionedInstance(REAL_SESSION, undefined, "1234");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await DeleteInstance.deleteDeprovisionedInstance(REAL_SESSION, "", "1234");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the instance-id parameter is undefined", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await DeleteInstance.deleteDeprovisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should throw an error if the instance-id parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await DeleteInstance.deleteDeprovisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noInstanceId.message);
    });
});
