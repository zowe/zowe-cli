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
import { IO, Session } from "@zowe/imperative";
import { Get } from "../../../../../../zosfiles/src/methods/get";


process.env.FORCE_COLOR = "0";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let REAL_SESSION: Session;
let systemProps: ITestPropertiesSchema;
let account: string;
let jcl: string;
describe("zos-jobs submit stdin command", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_submit_stdin_command",
            tempProfileTypes: ["zosmf"]
        });

        systemProps = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        account = systemProps.tso.account;
        const maxJobNamePrefixLength = 5;
        // JCL to submit
        jcl = (await Get.dataSet(REAL_SESSION, systemProps.zosjobs.iefbr14Member)).toString();

        // Create an local file with JCL to submit
        const bufferJCL: Buffer = Buffer.from(jcl);
        IO.createFileSync(__dirname + "/testFileOfLocalJCL.txt");
        IO.writeFile(__dirname + "/testFileOfLocalJCL.txt", bufferJCL);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);

        // Delete created uss file
        const localJCL: string = `${__dirname}\\testFileOfLocalJCL.txt`;
        IO.deleteFile(localJCL);
    });

    describe("Live system tests", () => {
        it("should submit a job using JCL on stdin", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_stdin.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
        });

        it("should submit a job using JCL on stdin with 'view-all-spool-content' option", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_stdin_vasc.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt", "--vasc"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Spool file");
            expect(response.stdout.toString()).toContain("JES2");
        });
        it("should submit a job and wait for it to reach output status", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_stdin_wait.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("retcode");
            expect(response.stdout.toString()).toContain("CC 0000");
            expect(response.stdout.toString()).not.toContain("null"); // retcode should not be null
        });
        it("should submit a job using JCL on stdin with 'directory' option", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_stdin_with_directory.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt", "--directory", "./"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
            expect(response.stdout.toString()).toContain("Successfully downloaded output to ./");
            expect(new RegExp("JOB\\d{5}", "g").test(response.stdout.toString())).toBe(true);
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
            let DEFAULT_SYSTEM_PROPS: ITestPropertiesSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_submit_local_file_without_profiles"
                });

                DEFAULT_SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("should submit a job in an existing valid local file", async () => {
                const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                // if API Mediation layer is being used (basePath has a value) then
                // set an ENVIRONMENT variable to be used by zowe.
                if (DEFAULT_SYSTEM_PROPS.zosmf.basePath != null) {
                    TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = DEFAULT_SYSTEM_PROPS.zosmf.basePath;
                }

                const response = runCliScript(__dirname + "/__scripts__/submit_valid_stdin_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        __dirname + "/testFileOfLocalJCL.txt",
                        DEFAULT_SYSTEM_PROPS.zosmf.host,
                        DEFAULT_SYSTEM_PROPS.zosmf.port,
                        DEFAULT_SYSTEM_PROPS.zosmf.user,
                        DEFAULT_SYSTEM_PROPS.zosmf.password,
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("jobname");
                expect(response.stdout.toString()).toContain("jobid");
            });
        });
    });
});
