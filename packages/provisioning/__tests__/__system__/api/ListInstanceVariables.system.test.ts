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

import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import {
    IProvisionedInstance,
    IProvisionedInstanceVariables,
    ListInstanceVariables,
    ListRegistryInstances,
    noInstanceId,
    noSessionProvisioning,
    nozOSMFVersion,
    ProvisioningConstants
} from "../../../../provisioning";

const MAX_TIMEOUT_NUMBER: number = 3600000;

let testEnvironment: ITestEnvironment;

let REAL_SESSION: Session;

function expectZosmfResponseSucceeded(response: IProvisionedInstanceVariables, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IProvisionedInstanceVariables, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("ListInstanceVariables (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_list_instance_variables"
        });

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("listVariablesCommon should succeed and return a list of variables of the provisioned instance", async () => {
        let response: IProvisionedInstanceVariables;
        let error: ImperativeError;
        let instance: IProvisionedInstance;
        let instanceId: string;
        try {
            instance = (await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION))["scr-list"][0];
            instanceId = instance["object-id"];
            response = await ListInstanceVariables.listVariablesCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response.variables).toBeDefined();
        expect(response.variables.length).toBeGreaterThan(0);
    }, MAX_TIMEOUT_NUMBER);

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
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
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
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
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
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
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
        expectZosmfResponseFailed(response, error, noInstanceId.message);
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
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });
});

