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

import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { Imperative, Session } from "@brightside/imperative";
import { IProvisionedInstance, ListRegistryInstances, ProvisioningConstants } from "../../../../../";
import { ProvisioningTestUtils } from "../../../../__resources__/utils/ProvisioningTestUtils";
import { ITestZosmfSchema } from "../../../../../../../__tests__/__src__/properties/ITestZosmfSchema";

let TEST_ENVIRONMENT: ITestEnvironment;
let REAL_SESSION: Session;
let templateName: string;
let instanceID: string;

describe("provisioning list instance-info", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_list_instance-info",
            tempProfileTypes: ["zosmf"]
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        templateName = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        let instance: IProvisionedInstance;
        instance = await ProvisioningTestUtils.getProvisionedInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, templateName);
        instanceID = instance["object-id"];
        Imperative.console.info(`Provisioned instance: ${instance["external-name"]}`);
    }, ProvisioningTestUtils.MAX_TIMEOUT_TIME);

    it("should display instance info", async () => {
        const instance = (await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION))["scr-list"]
            .pop()["external-name"];
        Imperative.console.info(`Instance name: ${instance}`);
        const regex = fs.readFileSync(__dirname + "/__regex__/instance_info_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/instanceInfo.sh", TEST_ENVIRONMENT, [instance]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, ProvisioningTestUtils.MAX_CLI_TIMEOUT);

    describe("without profiles", () => {
        const zOSMF: ITestZosmfSchema = {
            host: null,
            port: null,
            user: null,
            pass: null,
            rejectUnauthorized: false
        };

        // Create a separate test environment for no profiles
        let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "provisioning_catalog_templates_without_profiles",
            });

            zOSMF.host = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf.host;
            zOSMF.port = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf.port;
            zOSMF.user = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf.user;
            zOSMF.pass = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf.pass;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            await ProvisioningTestUtils.removeRegistryInstance(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION, instanceID);
        });

        it("should display instance info", async () => {
            const instance = (await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION))["scr-list"]
                .pop()["external-name"];
            Imperative.console.info(`Instance name: ${instance}`);
            const regex = fs.readFileSync(__dirname + "/__regex__/instance_info_response.regex").toString();
            const response = runCliScript(__dirname + "/__scripts__/instanceInfo_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    instance,
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
});
