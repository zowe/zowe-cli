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

import { isNullOrUndefined } from "util";
import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import {
    DeleteInstance,
    IPerformActionResponse,
    IProvisionedInstances,
    ListRegistryInstances,
    noInstanceId,
    noSessionProvisioning,
    nozOSMFVersion,
    PerformAction,
    ProvisioningConstants,
    ProvisionPublishedTemplate
} from "../../../../provisioning";


const MAX_TIMEOUT_NUMBER: number = 3600000;
const SLEEP_TIME: number = 10000;

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;

let templateName: string;
let instanceName: string;

let REAL_SESSION: Session;


function expectZosmfResponseFailed(response: IPerformActionResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

async function findInstanceId(state: string) {
    let instanceId: string;
    let instances: IProvisionedInstances;
    let error: ImperativeError;
    try {
        instances = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION);
        for (const instance of instances["scr-list"]) {
            if (instance["external-name"].includes(instanceName) && instance.state === state) {
                instanceId = instance["object-id"];
            }
        }
        return instanceId;
    } catch (thrownError) {
        error = thrownError;
        Imperative.console.info(`Error ${error}`);
    }
}

function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

describe("DeleteInstance (system)", () => {
    let instanceId: string;
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_perform_action"
        });

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        templateName = testEnvironment.systemTestProperties.provisioning.templateName;
        instanceName = testEnvironment.systemTestProperties.provisioning.instanceName;

        let error: ImperativeError;
        try {
            await sleep(SLEEP_TIME);
            instanceId = await findInstanceId("deprovisioned");
            Imperative.console.info(`Instance id of deprovisioned instance ${instanceId}`);
            if (isNullOrUndefined(instanceId)) {
                instanceId = await findInstanceId("provisioned");
                if (isNullOrUndefined(instanceId)) {
                    await ProvisionPublishedTemplate.provisionTemplateCommon(
                        REAL_SESSION,
                        ProvisioningConstants.ZOSMF_VERSION,
                        templateName,
                        defaultSystem.tso.account,
                    );
                    while (isNullOrUndefined(instanceId)) {
                        await sleep(SLEEP_TIME);
                        instanceId = await findInstanceId("provisioned");
                    }
                    Imperative.console.info(`Instance id of provisioned instance ${instanceId}`);
                }

                await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    instanceId, "deprovision");
                while (isNullOrUndefined(instanceId)) {
                    await sleep(SLEEP_TIME);
                    instanceId = await findInstanceId("deprovisioned");
                }
                Imperative.console.info(`Instance id of deprovisioned instance ${instanceId}`);
            }

        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
    }, MAX_TIMEOUT_NUMBER);

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });


    it("should succeed with correct parameters and return an empty response from z/OSMF", async () => {
        let response: any;
        let error: ImperativeError;
        try {
            await sleep(SLEEP_TIME);
            response = await DeleteInstance.deleteDeprovisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(response).toEqual("");

    }, MAX_TIMEOUT_NUMBER);

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
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
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
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
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
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
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
        expectZosmfResponseFailed(response, error, noInstanceId.message);
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
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });
});
