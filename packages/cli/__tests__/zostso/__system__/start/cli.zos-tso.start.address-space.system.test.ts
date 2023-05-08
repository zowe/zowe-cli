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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import * as fs from "fs";
import { Session } from "@zowe/imperative";
import { StopTso } from "@zowe/zos-tso-for-zowe-sdk";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let systemProps: ITestPropertiesSchema;
let REAL_SESSION: Session;
const seven = 7;
describe("zos-tso start address-space", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_tso_start_as",
            tempProfileTypes: ["zosmf", "tso"]
        });
        systemProps = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should successfully issue the command", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/address_space_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/address-space/address_space_success.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        const key = response.stdout.toString().split("\n")[0].split(" ")[seven];
        StopTso.stop(REAL_SESSION, key);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    it("should honor the logon proc specified in the profile", async () => {
        systemProps = TEST_ENVIRONMENT.systemTestProperties;
        const fakeProc = "F4K3PR0C";
        const response = runCliScript(__dirname + "/__scripts__/address-space/change_proc.sh", TEST_ENVIRONMENT, [
            systemProps.tso.account,
            fakeProc
        ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain(fakeProc);
    });

    it("should be able to successfully start an address space using --servlet-key-only", async () => {
        const response = runCliScript(__dirname + "/__scripts__/address-space/address_space_sko.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        const key = response.stdout.toString().trim();
        StopTso.stop(REAL_SESSION, key);
    });

    describe("without profiles", () => {

        // Create a separate test environment for no profiles
        let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
        let SYSTEM_PROPS: ITestPropertiesSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_tso_start_as_without_profiles"
            });
            SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should successfully issue the command without a profile", async () => {
            const regex = fs.readFileSync(__dirname + "/__regex__/address_space_response.regex").toString();

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (SYSTEM_PROPS.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = SYSTEM_PROPS.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/address-space/address_space_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    SYSTEM_PROPS.tso.account,
                    SYSTEM_PROPS.zosmf.host,
                    SYSTEM_PROPS.zosmf.port,
                    SYSTEM_PROPS.zosmf.user,
                    SYSTEM_PROPS.zosmf.password,
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const key = response.stdout.toString().split("\n")[0].split(" ")[seven];
            StopTso.stop(REAL_SESSION, key);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        });

        it("should successfully issue the command with an account with an # in it", async () => {
            const regex = fs.readFileSync(__dirname + "/__regex__/address_space_response.regex").toString();

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (SYSTEM_PROPS.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = SYSTEM_PROPS.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/address-space/address_space_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    "ACCT#",
                    SYSTEM_PROPS.zosmf.host,
                    SYSTEM_PROPS.zosmf.port,
                    SYSTEM_PROPS.zosmf.user,
                    SYSTEM_PROPS.zosmf.password,
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const key = response.stdout.toString().split("\n")[0].split(" ")[seven];
            StopTso.stop(REAL_SESSION, key);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        });
    });
});
