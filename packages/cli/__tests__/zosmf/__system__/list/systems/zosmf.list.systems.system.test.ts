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


describe("zosmf list systems", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_list_systems"
        });

        host = testEnvironment.systemTestProperties.zosmf.host;
        port = testEnvironment.systemTestProperties.zosmf.port;
        user = testEnvironment.systemTestProperties.zosmf.user;
        pass = testEnvironment.systemTestProperties.zosmf.password;
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
                testName: "zos_list_systems_command_without_profiles"
            });

            SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should successfully list systems with options only on the command line", async () => {
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

            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_systems_use_cli_opts.sh",
                TEST_ENVIRONMENT_NO_PROF, opts
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("systemNickName");
        });

        it("should successfully list systems with pem cert", async () => {
            if (SYSTEM_PROPS.certPem.zosmf.certFile == null) {
                // Logging a message is the best we can do since Jest doesn't support programmatically skipping tests
                process.stdout.write("Skipping test because pem cert file is undefined\n");
            } else {
                const opts = [
                    "--host", SYSTEM_PROPS.certPem.zosmf.host || SYSTEM_PROPS.zosmf.host,
                    "--port", SYSTEM_PROPS.certPem.zosmf.port || SYSTEM_PROPS.zosmf.port,
                    "--cert-file", SYSTEM_PROPS.certPem.zosmf.certFile,
                    "--cert-key-file", SYSTEM_PROPS.certPem.zosmf.certKeyFile,
                    "--reject-unauthorized", SYSTEM_PROPS.certPem.zosmf.rejectUnauthorized || SYSTEM_PROPS.zosmf.rejectUnauthorized
                ];

                const response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_systems_use_cli_opts.sh",
                    TEST_ENVIRONMENT_NO_PROF, opts
                );
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("systemNickName");
            }
        });
    });

    describe("Success scenarios", () => {

        it("should display number of defined z/OSMF systems", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_systems.sh", testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("systemNickName");
        });

        it("should display number of defined z/OSMF systems and print attributes", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_systems.sh", testEnvironment, ["--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("systemNickName");
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
            response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_systems.sh", testEnvironment);
            expect(stripNewLines(response.stderr.toString())).toContain("connect ECONNREFUSED");
        });
    });
});
