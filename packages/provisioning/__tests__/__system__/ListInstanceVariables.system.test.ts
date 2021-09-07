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
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import {
    IProvisionedInstance,
    IProvisionedInstanceVariables,
    ListInstanceVariables,
    noInstanceId,
    noSessionProvisioning,
    ProvisioningConstants
} from "../../src";
import { ProvisioningTestUtils } from "../__resources__/utils/ProvisioningTestUtils";

let testEnvironment: ITestEnvironment;
let templateName: string;
let instanceID: string;

let REAL_SESSION: Session;

describe("ListInstanceVariables (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_list_instance_vars"
        });
        templateName = testEnvironment.systemTestProperties.provisioning.templateName;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        const instance: IProvisionedInstance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            templateName);
        instanceID = instance["object-id"];
        Imperative.console.info(`Provisioned instance: ${instance["external-name"]}`);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
        await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
    });

    it("listVariablesCommon should succeed and return a list of variables of the provisioned instance", async () => {
        let response: IProvisionedInstanceVariables;
        let error: ImperativeError;
        try {
            response = await ListInstanceVariables.listVariablesCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response.variables).toBeDefined();
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("listVariablesCommon should fail and throw an error if the session parameter is undefined", async () => {
        let response: IProvisionedInstanceVariables;
        let error: ImperativeError;
        try {
            response = await ListInstanceVariables.listVariablesCommon(undefined, ProvisioningConstants.ZOSMF_VERSION, "12345");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("listVariables should fail and throw an error if the z/OSMF version parameter is undefined", async () => {
        let response: IProvisionedInstanceVariables;
        let error: ImperativeError;
        try {
            response = await ListInstanceVariables.listVariablesCommon(REAL_SESSION, undefined, "12345");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("listVariables should fail and throw an error if the z/OSMF version parameter is an empty string", async () => {
        let response: IProvisionedInstanceVariables;
        let error: ImperativeError;
        try {
            response = await ListInstanceVariables.listVariablesCommon(REAL_SESSION, "", "12345");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("listVariables should fail and throw an error if the instance id parameter is undefined", async () => {
        let response: IProvisionedInstanceVariables;
        let error: ImperativeError;
        try {
            response = await ListInstanceVariables.listVariablesCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("listVariables should fail and throw an error if the instance id parameter is an empty string", async () => {
        let response: IProvisionedInstanceVariables;
        let error: ImperativeError;
        try {
            response = await ListInstanceVariables.listVariablesCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noInstanceId.message);
    });
});

