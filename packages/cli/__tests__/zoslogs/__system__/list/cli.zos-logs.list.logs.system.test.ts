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

import { ICommandResponse } from "@zowe/imperative";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

// Expected length constants
const FOLLOW_UP_ATTEMPTS: number = 3;

describe("zos-logs list logs", () => {
    // Create the unique test environment with zosmf profiles
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_logs_list_logs",
            tempProfileTypes: ["zosmf"]
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should complete the command successfully", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/success_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/logs/list_logs_successful.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        // const consoleLogger = Imperative.console;
        // consoleLogger.debug("----My debug data---" + response.stdout.toString());
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    it("should complete the command successfully and return a valid JSON response", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/success_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/logs/list_logs_successful_rfj.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        // Convert response to an object and check fields
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());
        expect(respObj.success).toBe(true);
        expect(respObj.message).toBe("");
        expect(respObj.stderr).toBe("");
        expect(respObj.error).toBeUndefined();
        expect(new RegExp(regex, "g").test(respObj.stdout.toString())).toBe(true);
    });

    it("should complete the command with all options", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/success_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/logs/list_logs_all_options.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    describe("without profiles", () => {
        let DEFAULT_SYSTEM_PROPS: ITestPropertiesSchema;
        let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
        const regex = fs.readFileSync(__dirname + "/__regex__/success_response.regex").toString();
        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_logs_list_logs_without_profiles"
            });
            DEFAULT_SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });
        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });
        it("should execute zos-logs get and get the response", async () => {
            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";
            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (DEFAULT_SYSTEM_PROPS.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = DEFAULT_SYSTEM_PROPS.zosmf.basePath;
            }
            const response = runCliScript(__dirname + "/__scripts__/logs/list_logs_fully_qualified.sh", TEST_ENVIRONMENT_NO_PROF, [
                DEFAULT_SYSTEM_PROPS.zosmf.host,
                DEFAULT_SYSTEM_PROPS.zosmf.port,
                DEFAULT_SYSTEM_PROPS.zosmf.user,
                DEFAULT_SYSTEM_PROPS.zosmf.pass
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            // expect(response.stdout.toString()).toContain("IPLINFO DISPLAY");
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        });
    });
});
