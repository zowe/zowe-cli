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
import { ListInstanceInfo, ProvisioningConstants, ProvisionPublishedTemplate } from "../../../../../provisioning";
import * as fs from "fs";

const MAX_TIMEOUT_NUMBER: number = 3600000;
const SLEEP_TIME: number = 10000;

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let SYSTEM_PROPS: TestProperties;
let REAL_SESSION: Session;
let defaultSystem: ITestSystemSchema;
let templateName: string;
let instanceName: string;
let instanceId: string;
let accountNumber: string;

function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function prepareEnvironment() {
    let instanceState: string;
    instanceId = (await ProvisionPublishedTemplate.provisionTemplateCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
        templateName, accountNumber))["registry-info"]["object-id"];
    instanceState = "being-provisioned";
    while (instanceState !== "provisioned") {
        await sleep(SLEEP_TIME);
        instanceState = (await ListInstanceInfo.listInstanceCommon(REAL_SESSION,
            ProvisioningConstants.ZOSMF_VERSION, instanceId)).state;
        Imperative.console.info(`Instance state is ${instanceState}`);
    }
    Imperative.console.info(`Instance state is ${instanceState}`);
}

describe("provisioning delete instance", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_delete_instance",
            tempProfileTypes: ["zosmf", "tso"]
        });

        SYSTEM_PROPS = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = SYSTEM_PROPS.getDefaultSystem();
        templateName = templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        accountNumber = defaultSystem.tso.account;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        await prepareEnvironment();
    }, MAX_TIMEOUT_NUMBER);

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    // system test for perform action
    it("should successfully perform checkStatus action", async () => {
        instanceName = (await ListInstanceInfo.listInstanceCommon(REAL_SESSION,
            ProvisioningConstants.ZOSMF_VERSION, instanceId))["external-name"];
        Imperative.console.info(`Instance name is ${instanceName}`);
        const regex = fs.readFileSync(__dirname + "/../delete/__regex__/perform_checkStatus_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/instance/perform_checkStatus_action_success.sh", TEST_ENVIRONMENT,
            [instanceName]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, MAX_TIMEOUT_NUMBER);

    it("should successfully issue the command", async () => {
        let instanceState: string;
        instanceState = "being-deprovisioned";
        while (instanceState !== "deprovisioned") {
            await sleep(SLEEP_TIME);
            instanceState = (await ListInstanceInfo.listInstanceCommon(REAL_SESSION,
                ProvisioningConstants.ZOSMF_VERSION, instanceId)).state;
            Imperative.console.info(`Instance state is ${instanceState}`);
        }
        instanceName = (await ListInstanceInfo.listInstanceCommon(REAL_SESSION,
            ProvisioningConstants.ZOSMF_VERSION, instanceId))["external-name"];
        Imperative.console.info(`Instance name is ${instanceName}`);
        const response = runCliScript(__dirname + "/__scripts__/instance/delete_instance_success.sh", TEST_ENVIRONMENT,
            [instanceName]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout).toMatchSnapshot();
    }, MAX_TIMEOUT_NUMBER);
});
