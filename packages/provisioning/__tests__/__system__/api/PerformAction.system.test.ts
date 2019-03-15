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

import { isNullOrUndefined } from "util";
import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import {
    DeleteInstance,
    IPerformActionResponse,
    IProvisionedInstances,
    ListInstanceInfo,
    ListRegistryInstances,
    noActionName,
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
const actionName: string = "deprovision";
let RESPONSE_URI: string = `${ProvisioningConstants.RESOURCE}/${ProvisioningConstants.ZOSMF_VERSION}/${ProvisioningConstants.INSTANCES_RESOURCE}/`;

let REAL_SESSION: Session;


function expectZosmfResponseSucceeded(response: IPerformActionResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

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

describe("PerformAction.doProvisioningActionCommon (system)", () => {
    let instanceId: string;
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_perform_action"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        templateName = testEnvironment.systemTestProperties.provisioning.templateName;
        instanceName = testEnvironment.systemTestProperties.provisioning.instanceName;

        let error: ImperativeError;
        try {
            await sleep(SLEEP_TIME);
            instanceId = await findInstanceId("provisioned");
            Imperative.console.info(`Instance id of provisioned instance ${instanceId}`);
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

        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
    }, MAX_TIMEOUT_NUMBER);

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
        let instanceState = "being-deprovisioned";
        while (instanceState === "being-deprovisioned") {
            await sleep(SLEEP_TIME);
            instanceState = (await ListInstanceInfo.listInstanceCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId)).state;
            Imperative.console.info(`Instance state is ${instanceState}`);
        }
        await DeleteInstance.deleteDeprovisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId);
    }, MAX_TIMEOUT_NUMBER);


    it("should succeed with correct parameters and return a response from z/OSMF", async () => {
        let response: IPerformActionResponse;
        let error: ImperativeError;
        try {
            await sleep(SLEEP_TIME);
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId, actionName);
            Imperative.console.info(`Response ${response["action-uri"]}`);
            RESPONSE_URI += `${instanceId}/${ProvisioningConstants.ACTIONS_RESOURCES}/${response["action-id"]}`;
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response["action-id"]).toBeDefined();
        expect(response["action-uri"]).toBeDefined();
        expect(response["action-uri"]).toEqual(RESPONSE_URI);
    }, MAX_TIMEOUT_NUMBER);

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(undefined, ProvisioningConstants.ZOSMF_VERSION, "1234", actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, undefined, "1234", actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, "", "1234", actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("throw an error if the instance-id parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined, actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should throw an error if the instance-id parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, "", actionName);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noInstanceId.message);
    });

    it("should throw an error if the action name parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, "1234", undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noActionName.message);
    });

    it("should throw an error if the action name parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPerformActionResponse;
        try {
            response = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, "1234", "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noActionName.message);
    });

});
