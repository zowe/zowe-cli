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

import { inspect } from "util";
import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import {
    IProvisionedInstance,
    ListInstanceInfo,
    ListRegistryInstances,
    noInstanceId,
    noSessionProvisioning,
    nozOSMFVersion,
    ProvisioningConstants
} from "../../../../provisioning";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

const MAX_TIMEOUT_NUMBER: number = 3600000;

let testEnvironment: ITestEnvironment;

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
            testName: "provisioning_list_instance-info"
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should succeed and return instance details", async () => {
        let error: ImperativeError;
        let response: IProvisionedInstance;
        let instanceId: any;
        try {
            instanceId = (await ListRegistryInstances.listRegistryCommon(REAL_SESSION,
                ProvisioningConstants.ZOSMF_VERSION))["scr-list"][0]["object-id"];
            Imperative.console.info(`Instance id ${instanceId}`);
            response = await ListInstanceInfo.listInstanceCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }

        expectZosmfResponseSucceeded(response, error);
        expect(response["object-id"]).toEqual(instanceId);
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
