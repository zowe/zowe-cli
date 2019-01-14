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
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { IWorkflows, ListWorkflows, noSessionWorkflows, nozOSMFVersion, WorkflowsConstants } from "../../../../workflows";

const MAX_TIMEOUT_NUMBER: number = 3600000;

let testEnvironment: ITestEnvironment;

let REAL_SESSION: Session;

function expectWorkflowResponseSucceeded(response: any, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectWorkflowResponseFailed(response: any, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("ListRegistryWorkflows (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "workflows_list_registry"
        });

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("listRegistryCommon should succeed and return list of workflows", async () => {
        let response: IWorkflows;
        let error: ImperativeError;

        try {
            response = await ListRegistryWorkflows.listRegistryCommon(REAL_SESSION, WorkflowConstants.ZOSMF_VERSION);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toBeGreaterThan(0);
    }, MAX_TIMEOUT_NUMBER);

    it("listRegistryCommon should succeed and return worklows filtered by 'Complete' status", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            const statusFilter = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, "Complete");
            response = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, statusFilter);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectWorkflowResponseSucceeded(response, error);
        expect(response["scr-list"][0].statusName).toEqual("Complete");
    }, MAX_TIMEOUT_NUMBER);

    it("listRegistryCommon should succeed and return instances filtered by 'vendor'", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;
        let externalName: string;
        try {
            externalName = (await ListRegistryInstances.listRegistryCommon(REAL_SESSION,
                ProvisioningConstants.ZOSMF_VERSION))["scr-list"][0]["external-name"];
            Imperative.console.info(`External name ${externalName}`);
            const cicsFilter = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, undefined, externalName);
            response = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, cicsFilter);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectWorkflowResponseSucceeded(response, error);
        expect(response["scr-list"][0]["external-name"]).toEqual(externalName);
    }, MAX_TIMEOUT_NUMBER);

    it("listRegistryCommon should succeed and return instances filtered by 'external-name' and 'type'", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;
        let instance: any;
        let externalName: string;
        let type: string;
        try {
            instance = (await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION))["scr-list"][0];
            Imperative.console.info(`Instance ${instance}`);
            externalName = instance["external-name"];
            Imperative.console.info(`External name ${externalName}`);
            type = instance.type;
            Imperative.console.info(`Type ${type}`);
            const filteredInstance = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, type, externalName);
            response = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, filteredInstance);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectWorkflowResponseSucceeded(response, error);
        expect(response["scr-list"][0]["external-name"]).toEqual(externalName);
        expect(response["scr-list"][0].type).toEqual(type);
    }, MAX_TIMEOUT_NUMBER);
    });
});

