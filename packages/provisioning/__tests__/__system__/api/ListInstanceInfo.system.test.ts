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
import {
    IProvisionedInstance,
    ListInstanceInfo,
    noInstanceId,
    noSessionProvisioning,
    nozOSMFVersion,
    ProvisioningConstants
} from "../../../";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ProvisioningTestUtils } from "../../__resources__/api/ProvisioningTestUtils";

const MAX_TIMEOUT_NUMBER: number = 3600000;

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;

let templateName: string;
let instanceName: string;
let instanceID: string;

let REAL_SESSION: Session;

function expectZosmfResponseSucceeded(response: IProvisionedInstance, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IProvisionedInstance, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("ListInstanceInfo.listInstanceCommon", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_list_registry"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();
        templateName = testEnvironment.systemTestProperties.provisioning.templateName;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        let instance: IProvisionedInstance;
        instance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
        instanceName = instance["external-name"];
        instanceID = instance["object-id"];
        Imperative.console.info(`Provisioned instance: ${instanceName}`);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
        await ProvisioningTestUtils.removeProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
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

        expectZosmfResponseSucceeded(response, error);
        expect(response["object-id"]).toEqual(instanceID);
    }, MAX_TIMEOUT_NUMBER);

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
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
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
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
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
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
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
        expectZosmfResponseFailed(response, error, noInstanceId.message);
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
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });
});
