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
import { ITestEnvironment, runCliScript } from "../../../../../../__tests__/__packages__/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import * as fs from "fs";

const MAX_CN_LENGTH: number = 10;

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

// Expected length constants
const FOLLOW_UP_ATTEMPTS: number = 3;

describe("zos-console issue command", () => {

    // Create the unique test environment with zosmf profiles
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_console_issue_command",
            tempProfileTypes: ["zosmf"]
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should complete the command successfully", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/d_iplinfo.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/command/command_successful.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    it("should complete the command successfully and return a valid JSON response", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/d_iplinfo.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/command/command_successful_rfj.sh", TEST_ENVIRONMENT);
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

    it("should accept console name", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/d_time.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/command/command_console.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    it("should accept solicited keyword", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_solkey.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("SYSTEM");
    });

    it("should accept console name and return a valid JSON response", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/d_time.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/command/command_console_rfj.sh", TEST_ENVIRONMENT);
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

    it("should include detailed info", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/d_time_detailed.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/command/command_detail.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    it("should include detailed info in JSON format", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/d_time_detailed.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/command/command_detail_rfj.sh", TEST_ENVIRONMENT);

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

    it("should return only the response key", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_key.sh", TEST_ENVIRONMENT);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString().length).toBeLessThan(MAX_CN_LENGTH);
    });

    it("should return only the response key in JSON response", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_key_rfj.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // Convert response to an object and check fields
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());
        expect(respObj.success).toBe(true);
        expect(respObj.message).toBe("");
        expect(respObj.stderr).toBe("");
        expect(respObj.error).toBeUndefined();
        expect(respObj.stdout.toString().length).toBeLessThan(MAX_CN_LENGTH);
        expect(respObj.data.commandResponse).toBe("");
    });

    it("should make follow-up attempts", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_follow-up.sh", TEST_ENVIRONMENT);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // Convert response to an object and check fields
        const respObj: ICommandResponse = JSON.parse(response.stdout.toString());
        expect(respObj.success).toBe(true);
        expect(respObj.message).toBe("");
        expect(respObj.stderr).toBe("");
        expect(respObj.error).toBeUndefined();
        expect(respObj.data).toBeDefined();
        expect(respObj.data.success).toBe(true);
        expect(respObj.data.zosmfResponse).toBeDefined();
        expect(respObj.data.zosmfResponse).toBeInstanceOf(Array);
        expect(respObj.data.zosmfResponse.length).toEqual(FOLLOW_UP_ATTEMPTS); // tslint:disable-line:no-magic-numbers
    });

    describe("without profiles", () => {
        let DEFAULT_SYSTEM_PROPS: ITestPropertiesSchema;
        let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_console_issue_command_without_profiles"
            });

            DEFAULT_SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should issue a command and collect the response", async () => {

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (DEFAULT_SYSTEM_PROPS.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = DEFAULT_SYSTEM_PROPS.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    DEFAULT_SYSTEM_PROPS.zosmf.host,
                    DEFAULT_SYSTEM_PROPS.zosmf.port,
                    DEFAULT_SYSTEM_PROPS.zosmf.user,
                    DEFAULT_SYSTEM_PROPS.zosmf.pass
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("IPLINFO DISPLAY");
        });
    });
});
