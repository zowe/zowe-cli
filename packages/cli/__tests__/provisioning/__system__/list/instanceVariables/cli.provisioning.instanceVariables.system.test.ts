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

import { ITestEnvironment, runCliScript } from "../../../../../../../__tests__/__packages__/ts-cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import * as fs from "fs";
import { Imperative, Session } from "@zowe/imperative";
import { IProvisionedInstance, ProvisioningConstants } from "@zowe/provisioning-for-zowe-sdk";
import { ITestZosmfSchema } from "../../../../../../../__tests__/__src__/properties/ITestZosmfSchema";
import { ProvisioningTestUtils } from "../../../../../../../packages/provisioning/__tests__/__resources__/utils/ProvisioningTestUtils";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let REAL_SESSION: Session;
let instance: IProvisionedInstance;
let templateName: string;
let instanceID: string;

describe("provisioning list instance-variables", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_list_instance_vars",
            tempProfileTypes: ["zosmf"]
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;

        instance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
        instanceID = instance["object-id"];
        Imperative.console.info(`Provisioned instance: ${instance["external-name"]}`);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("should display instance info(expects first instance in registry to have variables)", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/instance_variables_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/instanceVariables.sh", TEST_ENVIRONMENT,
            [instance["external-name"]]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, ProvisioningTestUtils.MAX_CLI_TIMEOUT);

    // Create a separate test environment for no profiles
    describe("without profiles", () => {
        let zOSMF: ITestZosmfSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "provisioning_list_instance_vars_no_profile"
            });
            zOSMF = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf;
        });

        it("should display instance info (expects first instance in registry to have variables)", async () => {
            const regex = fs.readFileSync(__dirname + "/__regex__/instance_variables_response.regex").toString();
            const response = runCliScript(__dirname + "/__scripts__/instanceVariables_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    instance["external-name"],
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
        await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);
});
