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
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { PerformAction, ProvisioningConstants } from "../../../../";
import { ProvisioningTestUtils } from "../../../__resources__/utils/ProvisioningTestUtils";
import { ITestZosmfSchema } from "../../../../../../__tests__/__src__/properties/ITestZosmfSchema";

// Test Environment populated in the beforeAll();
const RESPONSE_CHECK = "was successfully deleted";
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let REAL_SESSION: Session;
let templateName: string;


describe("provisioning delete instance with profile", () => {
    let instance: any;
    let instanceID: string;
    let instanceName: string;
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_delete_instance",
            tempProfileTypes: ["zosmf", "tso"]
        });

        templateName = templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

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
    }, ProvisioningTestUtils.MAX_CLI_TIMEOUT);
});


describe("provisioning delete instance without profiles", () => {
    let zOSMF: ITestZosmfSchema;
    let instance: any;
    let instanceID: string;
    let instanceName: string;

    // Create a separate test environment for no profiles
    beforeAll(async () => {
        TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
            testName: "provisioning_delete_instance_no_profile",
        });

        templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        zOSMF = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf;

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
                zOSMF.pass
            ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain(RESPONSE_CHECK);
    }, ProvisioningTestUtils.MAX_CLI_TIMEOUT);
});
