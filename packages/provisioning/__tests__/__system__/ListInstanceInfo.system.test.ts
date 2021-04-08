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
import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { nozOSMFVersion } from "@zowe/core-for-zowe-sdk";
import {
    IProvisionedInstance,
    ListInstanceInfo,
    noInstanceId,
    noSessionProvisioning,
    ProvisioningConstants
} from "../../src";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ProvisioningTestUtils } from "../__resources__/utils/ProvisioningTestUtils";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

let templateName: string;
let instanceID: string;

let REAL_SESSION: Session;

describe("ListInstanceInfo.listInstanceCommon", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_list_instance"
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
        await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
    });

    it("should succeed and return instance details", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstance;
        try {
            Imperative.console.info(`Instance id ${instanceID}`);
            response = await ListInstanceInfo.listInstanceCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }

        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["object-id"]).toEqual(instanceID);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("should fail and throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstance;
        try {
            response = await ListInstanceInfo.listInstanceCommon(undefined, ProvisioningConstants.ZOSMF_VERSION, "1234");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should fail and throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstance;
        try {
            response = await ListInstanceInfo.listInstanceCommon(REAL_SESSION, undefined, "1234");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should fail and throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstance;
        try {
            response = await ListInstanceInfo.listInstanceCommon(REAL_SESSION, "", "1234");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should fail and throw an error if the instance-id parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstance;
        try {
            response = await ListInstanceInfo.listInstanceCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should fail and throw an error if the instance-id parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstance;
        try {
            response = await ListInstanceInfo.listInstanceCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, "");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noInstanceId.message);
    });
});
