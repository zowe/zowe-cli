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
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { IO } from "@zowe/imperative";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let host: string;
let port: number;
let user: string;
let pass: string;
let systemProps: ITestPropertiesSchema;

describe("zosmf check status", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_check_status"
        });

        systemProps = testEnvironment.systemTestProperties;
        host = systemProps.zosmf.host;
        port = systemProps.zosmf.port;
        user = systemProps.zosmf.user;
        pass = systemProps.zosmf.password;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("without profiles", () => {

        // Create a separate test environment for no profiles
        let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
        let SYSTEM_PROPS: ITestPropertiesSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_check_status_command_without_profiles"
            });

            SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should successfully check status with options only on the command line", async () => {
            const opts = [
                "--host", SYSTEM_PROPS.zosmf.host,
                "--port", SYSTEM_PROPS.zosmf.port,
                "--user", SYSTEM_PROPS.zosmf.user,
                "--password", SYSTEM_PROPS.zosmf.password,
                "--reject-unauthorized", SYSTEM_PROPS.zosmf.rejectUnauthorized
            ];

            if (SYSTEM_PROPS.zosmf.basePath != null) {
                opts.push("--base-path");
                opts.push(SYSTEM_PROPS.zosmf.basePath);
            }

            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_check_status_use_cli_opts.sh",
                TEST_ENVIRONMENT_NO_PROF, opts
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(
                "The user " + SYSTEM_PROPS.zosmf.user +
                " successfully connected to z/OSMF"
            );
        });
    });

    describe("Success scenarios", () => {

        it("should display successful connection to z/OSMF", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_check_status.sh", testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(stripNewLines(response.stdout.toString())).toContain("The user " + user + " successfully connected to z/OSMF");
        });

        it("should display successful connection to z/OSMF and print attributes", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_check_status.sh", testEnvironment, ["--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(stripNewLines(response.stdout.toString())).toContain("The user " + user + " successfully connected to z/OSMF");
        });
    });

    describe("Expected failures", () => {

        it("should fail due to invalid port", async () => {
            // update temporary zowe profile with an invalid port
            const scriptPath = testEnvironment.workingDir + "_create_profile_invalid_port";
            const bogusPort = 12345;
            const command = `zowe config set profiles.${testEnvironment.tempProfiles?.zosmf[0]}.properties.port ${bogusPort} --gc`;
            await IO.writeFileAsync(scriptPath, command);
            let response = runCliScript(scriptPath, testEnvironment);
            expect(response.status).toBe(0);
            // now check the status
            response = runCliScript(__dirname + "/__scripts__/command/zosmf_check_status.sh", testEnvironment);
            expect(stripNewLines(response.stderr.toString())).toContain("connect ECONNREFUSED");
        });
    });
});
