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
    IProvisionedInstances,
    ListRegistryInstances,
    noSessionProvisioning,
    ProvisioningConstants
} from "../../src";
import { ProvisioningTestUtils } from "../__resources__/utils/ProvisioningTestUtils";

const TYPE: string = "CICS";
let testEnvironment: ITestEnvironment;
let REAL_SESSION: Session;
let templateName: string;
let instanceName: string;
let instanceID: string;

describe("ListRegistryInstances (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_list_registry"
        });
        templateName = testEnvironment.systemTestProperties.provisioning.templateName;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        const instance: IProvisionedInstance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            templateName);
        instanceName = instance["external-name"];
        instanceID = instance["object-id"];
        Imperative.console.info(`Provisioned instance: ${instanceName}`);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
        await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

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
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"]).toBeDefined();
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

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
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"][0].type).toEqual(TYPE);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("listRegistryCommon should succeed and return instances filtered by 'external-name'", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;
        try {
            Imperative.console.info(`External name ${instanceName}`);
            const cicsFilter = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, undefined, instanceName);
            response = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, cicsFilter);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"][0]["external-name"]).toEqual(instanceName);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("listRegistryCommon should succeed and return instances filtered by 'external-name' and CICS 'type'", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;
        try {
            Imperative.console.info(`External name ${instanceName}`);
            Imperative.console.info(`Type ${TYPE}`);
            const filteredInstance = ListRegistryInstances.getResourcesQuery(ProvisioningConstants.ZOSMF_VERSION, TYPE, instanceName);
            response = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, filteredInstance);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"][0]["external-name"]).toEqual(instanceName);
        expect(response["scr-list"][0].type).toEqual(TYPE);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

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
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
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
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
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
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("listFilteredRegistry should succeed and return a list of instances filtered by CICS 'type'", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;
        try {
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION,
                ProvisioningConstants.ZOSMF_VERSION, TYPE, undefined);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toBeGreaterThan(0);
        expect(response["scr-list"][0].type).toEqual(TYPE);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("listFilteredRegistry should succeed and return a list of instances filtered by 'external-name'", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;
        try {
            Imperative.console.info(`External name ${instanceName}`);
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                undefined, instanceName);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"].length).toBeGreaterThan(0);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("listFilteredRegistry should succeed and return instances filtered by 'external-name' and CICS 'type'", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;
        try {
            Imperative.console.info(`External name ${instanceName}`);
            Imperative.console.info(`Type ${TYPE}`);
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                TYPE, instanceName);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["scr-list"][0]["external-name"]).toEqual(instanceName);
        expect(response["scr-list"][0].type).toEqual(TYPE);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("listFilteredRegistry should fail and throw an error if the session parameter is undefined", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;
        try {
            response = await ListRegistryInstances.listFilteredRegistry(undefined, ProvisioningConstants.ZOSMF_VERSION,
                undefined, undefined);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("listFilteredRegistry should fail and throw an error if the z/OSMF version parameter is undefined", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION, undefined, undefined,
                undefined);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("listFilteredRegistry should fail and throw an error if the z/OSMF version parameter is an empty string", async () => {
        let response: IProvisionedInstances;
        let error: ImperativeError;

        try {
            response = await ListRegistryInstances.listFilteredRegistry(REAL_SESSION, "", undefined,
                undefined);
            Imperative.console.info(`Response ${response["scr-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });
});

