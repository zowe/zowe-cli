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
import { IProvisionedInstances, ListRegistryInstances, noSessionProvisioning, nozOSMFVersion, ProvisioningConstants } from "../../../../provisioning";

const MAX_TIMEOUT_NUMBER: number = 3600000;

let testEnvironment: ITestEnvironment;

let REAL_SESSION: Session;

function expectZosmfResponseSucceeded(response: any, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: any, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("ListRegistryInstances (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_list_registry"
        });

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("listRegistryCommon should succeed and return list of provisioned instances", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toBeGreaterThan(0);
    }, MAX_TIMEOUT_NUMBER);

    it("listRegistryCommon should succeed and return instances filtered by 'CICS' type", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            const cicsFilter = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, "CICS");
            response = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, cicsFilter);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"][0].type).toEqual("CICS");
    }, MAX_TIMEOUT_NUMBER);

    it("listRegistryCommon should succeed and return instances filtered by 'external-name'", async () => {
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
        expectZosmfResponseSucceeded(response, error);
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
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"][0]["external-name"]).toEqual(externalName);
        expect(response["scr-list"][0].type).toEqual(type);
    }, MAX_TIMEOUT_NUMBER);

    it("listRegistryCommon should fail and throw an error if the session parameter is undefined", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listRegistryCommon(undefined, ProvisioningConstants.ZOSMF_VERSION);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("listRegistryCommon should fail and throw an error if the z/OSMF version is an empty string", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, "");
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("listRegistryCommon should fail and throw an error if the z/OSMF version is undefined", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, undefined);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("listFilteredRegistry should succeed and return a list of instances filtered by 'type'", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION,
                ProvisioningConstants.ZOSMF_VERSION, "CICS", undefined);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toBeGreaterThan(0);
        expect(response["scr-list"][0].type).toEqual("CICS");
    }, MAX_TIMEOUT_NUMBER);

    it("listFilteredRegistry should succeed and return a list of instances filtered by 'external-name'", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;
        let externalName: string;

        try {
            externalName = (await ListRegistryInstances.listRegistryCommon(REAL_SESSION,
                ProvisioningConstants.ZOSMF_VERSION))["scr-list"][0]["external-name"];
            Imperative.console.info(`External name ${externalName}`);
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, undefined, externalName);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toBeGreaterThan(0);
        expect(response["scr-list"][0]["external-name"]).toEqual(externalName);
    }, MAX_TIMEOUT_NUMBER);

    it("listFilteredRegistry should succeed and return instances filtered by 'external-name' and 'type'", async () => {
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
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, type, externalName);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"][0]["external-name"]).toEqual(externalName);
        expect(response["scr-list"][0].type).toEqual(type);
    }, MAX_TIMEOUT_NUMBER);

    it("listFilteredRegistry should fail and throw an error if the session parameter is undefined", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listFilteredRegistry(undefined, ProvisioningConstants.ZOSMF_VERSION, undefined, undefined);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("listFilteredRegistry should fail and throw an error if the z/OSMF version parameter is undefined", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION, undefined, undefined, undefined);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("listFilteredRegistry should fail and throw an error if the z/OSMF version parameter is an empty string", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION, "", undefined, undefined);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });
});

