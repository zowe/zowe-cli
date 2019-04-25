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

// Test Environment populated in the beforeAll();
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { Session } from "@zowe/imperative";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ListCatalogTemplates } from "../../../../../";
import { ProvisioningConstants } from "../../../../../index";

let TEST_ENVIRONMENT: ITestEnvironment;
let REAL_SESSION: Session;
const TIMEOUT = 30000;

describe("provisioning list template-info", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_list_template-info",
            tempProfileTypes: ["zosmf"]
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display template info", async () => {
        const template = (await ListCatalogTemplates.listCatalogCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION))["psc-list"].pop().name;
        const regex = fs.readFileSync(__dirname + "/__regex__/template_info_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/templateInfo.sh", TEST_ENVIRONMENT, [template]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, TIMEOUT);

    describe("without profiles", () => {

        // Create a separate test environment for no profiles
        let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
        let DEFAULT_SYSTEM_PROPS: ITestPropertiesSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "provisioning_list_template_info_without_profiles"
            });

            DEFAULT_SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should display template info", async () => {
            const template = (await ListCatalogTemplates.listCatalogCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION))["psc-list"].pop().name;
            const regex = fs.readFileSync(__dirname + "/__regex__/template_info_response.regex").toString();
            const response = runCliScript(__dirname + "/__scripts__/templateInfo_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    template,
                    DEFAULT_SYSTEM_PROPS.zosmf.host,
                    DEFAULT_SYSTEM_PROPS.zosmf.port,
                    DEFAULT_SYSTEM_PROPS.zosmf.user,
                    DEFAULT_SYSTEM_PROPS.zosmf.pass
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        }, TIMEOUT);
    });
});
