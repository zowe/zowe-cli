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

import { Imperative } from "@zowe/core-for-zowe-sdk";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { PerformAction, ProvisioningConstants } from "@zowe/provisioning-for-zowe-sdk";
import { ProvisioningTestUtils } from "../../../../../provisioning/__tests__/__resources__/utils/ProvisioningTestUtils";
import { ITestZosmfSchema } from "../../../../../../__tests__/__src__/properties/ITestZosmfSchema";

const RESPONSE_CHECK = "was successfully deleted";

describe("provisioning delete instance with profile", () => {
    let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
    let instance: any;
    let instanceID: string;
    let instanceName: string;
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_delete_instance",
            tempProfileTypes: ["zosmf", "tso"]
        });

        const templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        const REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        // Provision the template to have an instance to delete
        instance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
        Imperative.console.info(`Provisioned instance: ${instance["external-name"]}`);
        instanceID = instance["object-id"];

        // Deprovision the instance
        instance = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            instanceID, ProvisioningTestUtils.ACTION_DEPROV);
        Imperative.console.info(`Deprovision of the instance started, action-id: ${instance["action-id"]}`);
        // Wait until instance state is 'deprovisioned'
        instance = await ProvisioningTestUtils.waitInstanceState(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            instanceID, ProvisioningTestUtils.STATE_DEPROV);
        instanceName = instance["external-name"];
        Imperative.console.info(`Deprovisioned instance: ${instanceName}`);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should successfully issue the command", async () => {
        const response = runCliScript(__dirname + "/__scripts__/instance/delete_instance_success.sh", TEST_ENVIRONMENT,
            [instanceName]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain(RESPONSE_CHECK);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);
});


describe("provisioning delete instance without profiles", () => {
    let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
    let zOSMF: ITestZosmfSchema;
    let instance: any;
    let instanceID: string;
    let instanceName: string;

    // Create a separate test environment for no profiles
    beforeAll(async () => {
        TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
            testName: "provisioning_delete_instance_no_profile"
        });

        zOSMF = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf;
        const templateName = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.provisioning.templateName;
        const REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT_NO_PROF);

        // Provision the template to have an instance to delete
        instance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
        Imperative.console.info(`Provisioned instance: ${instance["external-name"]}`);
        instanceID = instance["object-id"];

        // Deprovision the instance
        instance = await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            instanceID, ProvisioningTestUtils.ACTION_DEPROV);
        Imperative.console.info(`Deprovision of the instance started, action-id: ${instance["action-id"]}`);
        // Wait until instance state is 'deprovisioned'
        instance = await ProvisioningTestUtils.waitInstanceState(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            instanceID, ProvisioningTestUtils.STATE_DEPROV);
        instanceName = instance["external-name"];
        Imperative.console.info(`Deprovisioned instance: ${instanceName}`);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
    });

    it("should successfully delete an instance without profile", async () => {
        const response = runCliScript(__dirname + "/__scripts__/instance/delete_instance_fully_qualified.sh",
            TEST_ENVIRONMENT_NO_PROF,
            [
                instanceName,
                zOSMF.host,
                zOSMF.port,
                zOSMF.user,
                zOSMF.password
            ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain(RESPONSE_CHECK);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);
});
