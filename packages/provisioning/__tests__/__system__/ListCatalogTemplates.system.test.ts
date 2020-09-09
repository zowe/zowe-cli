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
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import {
    IPublishedTemplates,
    ListCatalogTemplates,
    noSessionProvisioning,
    nozOSMFVersion,
    ProvisioningConstants
} from "../../";
import { ProvisioningTestUtils } from "../__resources__/utils/ProvisioningTestUtils";

let testEnvironment: ITestEnvironment;
let REAL_SESSION: Session;

describe("ListCatalogTemplates", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "provisioning_list_catalog"
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should return list of templates", async () => {
        let response: IPublishedTemplates;
        let error: ImperativeError;
        try {
            response = await ListCatalogTemplates.listCatalogCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION);
            Imperative.console.info(`Response ${response["psc-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseSucceeded(response, error);
        expect(response["psc-list"]).toBeDefined();
        expect(response["psc-list"].length).toBeGreaterThan(0);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("should throw an error if the session parameter is undefined", async () => {
        let response: IPublishedTemplates;
        let error: ImperativeError;
        try {
            response = await ListCatalogTemplates.listCatalogCommon(undefined, ProvisioningConstants.ZOSMF_VERSION);
            Imperative.console.info(`Response ${response["psc-list"]}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, noSessionProvisioning.message);
    });

    it("should throw an error if the z/OSMF version parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IPublishedTemplates;
        try {
            response = await ListCatalogTemplates.listCatalogCommon(REAL_SESSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: IPublishedTemplates;
        try {
            response = await ListCatalogTemplates.listCatalogCommon(REAL_SESSION, "");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        ProvisioningTestUtils.expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });

});
