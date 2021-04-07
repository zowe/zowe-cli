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

import { Imperative, Session } from "@zowe/imperative";
import { ITestEnvironment, runCliScript } from "../../../../../../__tests__/__packages__/ts-cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ProvisioningConstants } from "@zowe/provisioning-for-zowe-sdk";
import * as fs from "fs";
import { ProvisioningTestUtils } from "../../../../../../packages/provisioning/__tests__/__resources__/utils/ProvisioningTestUtils";
import { ITestZosmfSchema } from "../../../../../../__tests__/__src__/properties/ITestZosmfSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let REAL_SESSION: Session;
let templateName: string;
let instance;
let instanceID: string;
let instanceName: string;

describe("provisioning perform action", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_perform_action",
            tempProfileTypes: ["zosmf", "tso"]
        });
        templateName = templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        // Provision an instance to use it later
        instance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
        instanceID = instance["object-id"];
        instanceName = instance["external-name"];
        Imperative.console.info(`Provisioned instance: ${instanceName}`);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("should successfully perform checkStatus action", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/perform_action_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/action/perform_checkStatus_action_success.sh", TEST_ENVIRONMENT,
            [instanceName]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, ProvisioningTestUtils.MAX_CLI_TIMEOUT);


    describe("without profiles", () => {
        let zOSMF: ITestZosmfSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "provisioning_perform_action_no_profile"
            });
            zOSMF = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf;
        });

        // system test for perform action
        it("should successfully perform deprovision action", async () => {
            const regex = fs.readFileSync(__dirname + "/__regex__/perform_action_response.regex").toString();
            const response = runCliScript(__dirname + "/__scripts__/action/perform_deprovision_fully_qualified.sh",
                TEST_ENVIRONMENT, [
                    instanceName,
                    zOSMF.host,
                    zOSMF.port,
                    zOSMF.user,
                    zOSMF.pass
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        }, ProvisioningTestUtils.MAX_CLI_TIMEOUT);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);

        // Wait until instance state is 'deprovisioned'
        instance = await ProvisioningTestUtils.waitInstanceState(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            instanceID, ProvisioningTestUtils.STATE_DEPROV);
        instanceName = instance["external-name"];
        Imperative.console.info(`Deprovisioned instance: ${instanceName}`);

        // Delete deprovisioned instance
        await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);
});

