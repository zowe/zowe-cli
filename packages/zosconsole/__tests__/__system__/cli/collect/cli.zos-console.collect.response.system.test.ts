/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ITestEnvironment } from "./../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "./../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;

describe("zos-console collect response", () => {

    describe("without profiles", () => {
        let systemProps;
        let defaultSystem: ITestSystemSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_console_collect_response_without_profiles"
            });

            systemProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSystem = systemProps.getDefaultSystem();
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should properly retrieve solicited messages by key with a fully qualified command", async () => {
            const regex = fs.readFileSync(__dirname + "/__regex__/d_time.regex").toString();
            const response = runCliScript(__dirname + "/__scripts__/response/response_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.pass
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        });
    });

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_console_collect_response",
            tempProfileTypes: ["zosmf"]
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/response/response_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should properly retrieve solicited messages by key", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/d_time.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/response/response_key.sh", TEST_ENVIRONMENT);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    it("should display error if no response-key provided", async () => {
        const response = runCliScript(__dirname + "/__scripts__/response/response_no_key.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toBe("");
    });

    it("should not accept wrong characters in the console name", async () => {
        const response = runCliScript(__dirname + "/__scripts__/response/response_console_wrong_.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toBe("");
    });
});
