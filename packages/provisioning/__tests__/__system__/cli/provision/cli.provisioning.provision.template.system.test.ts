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

import * as fs from "fs";
import { Imperative, Session } from "@zowe/imperative";
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { ProvisioningTestUtils } from "../../../__resources__/utils/ProvisioningTestUtils";
import { ProvisioningConstants } from "../../../..";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let REAL_SESSION: Session;
let defaultSystem: ITestPropertiesSchema;
let templateName: string;
let instanceID: string;

describe("provisioning provision template", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_prov_template",
            tempProfileTypes: ["zosmf", "tso"]
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        templateName = templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should successfully issue the command", async () => {
        const regex = fs.readFileSync(__dirname + "/../provision/__regex__/provision_template_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/template/provision_template_success.sh", TEST_ENVIRONMENT,
            [templateName]);

        // Get instanceID later delete that instance
        instanceID = new RegExp(regex, "g").exec(response.stdout.toString())[2];
        Imperative.console.info(`Instance ID: ${instanceID}`);
        // Delete the provisioned instance
        await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

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

        it("should successfully issue the command", async () => {
            const regex = fs.readFileSync(__dirname + "/../provision/__regex__/provision_template_response.regex").toString();
            const response = runCliScript(__dirname + "/__scripts__/template/provision_template_success_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    templateName,
                    DEFAULT_SYSTEM_PROPS.zosmf.host,
                    DEFAULT_SYSTEM_PROPS.zosmf.port,
                    DEFAULT_SYSTEM_PROPS.zosmf.user,
                    DEFAULT_SYSTEM_PROPS.zosmf.pass
                ]);

            // Get instanceID later delete that instance
            instanceID = new RegExp(regex, "g").exec(response.stdout.toString())[2];
            Imperative.console.info(`Instance ID: ${instanceID}`);
            // Delete the provisioned instance
            await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);
    });
});
