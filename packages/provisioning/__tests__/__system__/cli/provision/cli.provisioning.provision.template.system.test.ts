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
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { DeleteInstance, ListInstanceInfo, ListRegistryInstances, PerformAction, ProvisioningConstants } from "../../../../../provisioning";

const MAX_TIMEOUT_NUMBER: number = 3600000;
const SLEEP_TIME: number = 10000;

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let REAL_SESSION: Session;
let defaultSystem: ITestPropertiesSchema;
let templateName: string;
let instanceName: string;
let accountNumber: string;

function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function cleanUp() {
    const instances = await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION);
    for (const instance of instances["scr-list"]) {
        let instanceState: string;
        let instanceId: string;
        if (instance["external-name"].includes(instanceName)) {
            instanceId = instance["object-id"];
            if (instance.state === "being-provisioned") {
                instanceId = instance["object-id"];
                instanceState = instance.state;
                while (instanceState === "being-provisioned") {
                    await sleep(SLEEP_TIME);
                    instanceState = (await ListInstanceInfo.listInstanceCommon(REAL_SESSION,
                        ProvisioningConstants.ZOSMF_VERSION, instanceId)).state;
                    Imperative.console.info(`Instance state is ${instanceState}`);
                }
                Imperative.console.info(`Instance state is ${instanceState}`);
                await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    instanceId, "deprovision");
                instanceState = "being-deprovisioned";
                while (instanceState === "being-deprovisioned") {
                    await sleep(SLEEP_TIME);
                    instanceState = (await ListInstanceInfo.listInstanceCommon(REAL_SESSION,
                        ProvisioningConstants.ZOSMF_VERSION, instanceId)).state;
                    Imperative.console.info(`Instance state is ${instanceState}`);
                }
                Imperative.console.info(`Instance state is ${instanceState}`);
                await DeleteInstance.deleteDeprovisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceId);

            } else {
                await PerformAction.doProvisioningActionCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION,
                    instanceId, "deprovision");
            }
        }
    }
}

describe("provisioning provision template", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_prov_template",
            tempProfileTypes: ["zosmf", "tso"]
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        templateName = templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        accountNumber = defaultSystem.tso.account;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        instanceName = TEST_ENVIRONMENT.systemTestProperties.provisioning.instanceName;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        await cleanUp();
    }, MAX_TIMEOUT_NUMBER);

    it("should successfully issue the command", async () => {
        const regex = fs.readFileSync(__dirname + "/../provision/__regex__/provision_template_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/template/provision_template_success.sh", TEST_ENVIRONMENT,
            [templateName, accountNumber]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, MAX_TIMEOUT_NUMBER);

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
                    accountNumber,
                    DEFAULT_SYSTEM_PROPS.zosmf.host,
                    DEFAULT_SYSTEM_PROPS.zosmf.port,
                    DEFAULT_SYSTEM_PROPS.zosmf.user,
                    DEFAULT_SYSTEM_PROPS.zosmf.pass
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        }, MAX_TIMEOUT_NUMBER);
    });
});
