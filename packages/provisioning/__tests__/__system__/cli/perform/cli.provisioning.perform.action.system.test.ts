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

import { Imperative, Session } from "@brightside/imperative";
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { ProvisioningConstants } from "../../../../";
import * as fs from "fs";
import { ProvisioningTestUtils } from "../../../__resources__/utils/ProvisioningTestUtils";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let SYSTEM_PROPS: TestProperties;
let REAL_SESSION: Session;
let defaultSystem: ITestSystemSchema;
let templateName: string;
let instance;
let instanceID: string;
let instanceName: string;

describe("provisioning delete instance", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_perform_action",
            tempProfileTypes: ["zosmf", "tso"]
        });

        SYSTEM_PROPS = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = SYSTEM_PROPS.getDefaultSystem();
        templateName = templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        // Provision an instance to use it later
        instance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
        instanceID = instance["object-id"];
        instanceName = instance["external-name"];
        Imperative.console.info(`Provisioned instance: ${instanceName}`);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);

        // Wait until instance state is 'deprovisioned'
        instance = await ProvisioningTestUtils.waitInstanceState(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
            instanceID, ProvisioningTestUtils.STATE_DEPROV);
        instanceName = instance["external-name"];
        Imperative.console.info(`Deprovisioned instance: ${instanceName}`);

        // Delete deprovisioned instance
        await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    // system test for perform action
    it("should successfully perform checkStatus action", async () => {
        const regex = fs.readFileSync(__dirname + "/../perform/__regex__/perform_action_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/instance/perform_checkStatus_action_success.sh", TEST_ENVIRONMENT,
            [instanceName]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, ProvisioningTestUtils.MAX_CLI_TIMEOUT);

    // system test for perform action
    it("should successfully perform deprovision action", async () => {
        const regex = fs.readFileSync(__dirname + "/../perform/__regex__/perform_action_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/instance/perform_deprovision_action_success.sh", TEST_ENVIRONMENT,
            [instanceName]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, ProvisioningTestUtils.MAX_CLI_TIMEOUT);
});

