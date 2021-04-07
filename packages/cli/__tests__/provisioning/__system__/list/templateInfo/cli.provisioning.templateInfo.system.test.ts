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
import { ITestEnvironment, runCliScript } from "../../../../../../../__tests__/__packages__/ts-cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import * as fs from "fs";
import { Session } from "@zowe/imperative";
import { ProvisioningTestUtils } from "../../../../../../../packages/provisioning/__tests__/__resources__/utils/ProvisioningTestUtils";
import { ITestZosmfSchema } from "../../../../../../../__tests__/__src__/properties/ITestZosmfSchema";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let REAL_SESSION: Session;
let TEMPLATE_NAME: string;

describe("provisioning list template-info", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_list_template-info",
            tempProfileTypes: ["zosmf"]
        });
        TEMPLATE_NAME = TEST_ENVIRONMENT.systemTestProperties.provisioning.templateName;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
    });

    it("should display template info", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/template_info_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/templateInfo.sh", TEST_ENVIRONMENT, [TEMPLATE_NAME]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, ProvisioningTestUtils.MAX_CLI_TIMEOUT);

    describe("without profiles", () => {
        let zOSMF: ITestZosmfSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "provisioning_list_template_info_no_profile"
            });
            TEMPLATE_NAME = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.provisioning.templateName;
            zOSMF = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosmf;
        });

        it("should display template info", async () => {
            const regex = fs.readFileSync(__dirname + "/__regex__/template_info_response.regex").toString();
            const response = runCliScript(__dirname + "/__scripts__/templateInfo_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    TEMPLATE_NAME,
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
    });
});
