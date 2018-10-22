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

import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { IO, Session } from "@brightside/imperative";


process.env.FORCE_COLOR = "0";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let REAL_SESSION: Session;
let defaultSystem: ITestSystemSchema;
let systemProps: TestProperties;
let account: string;
let jcl: string;
describe("zos-jobs submit local-file command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_submit_local_file_command",
            tempProfileTypes: ["zosmf"]
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });

        account = defaultSystem.tso.account;
        const maxJobNamePrefixLength = 5;
        // JCL to submit
        jcl = "//" + defaultSystem.zosmf.user.toUpperCase().substring(0, maxJobNamePrefixLength) + "J JOB  " + account +
            ",'Brightside Test',MSGLEVEL=(1,1),MSGCLASS=4,CLASS=C\n" +
            "//EXEC PGM=IEFBR14";

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

    describe("help", () => {
        it("should not change", () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_local_file_help.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });


    describe("Live system tests", () => {
        it("should submit a job in an existing valid local file ", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_local_file.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
        });

        it("should submit a job in an existing valid local file with 'view-all-spool-content' option", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_local_file_vasc.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt", "--vasc"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Spool file");
            expect(response.stdout.toString()).toContain("JES2");
        });

        it("should submit a job in an existing valid local file with 'directory' option", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_local_file_with_directory.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt", "--directory", "./"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
            expect(response.stdout.toString()).toContain("Successfully downloaded output to ./");
            expect(new RegExp("JOB\\d{5}", "g").test(response.stdout.toString())).toBe(true);
        });


        it("should fail if the local file does not exist ", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_invalid_local_file.sh",
                TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stderr.toString().toLowerCase()).toContain("error");
            expect(response.stderr.toString().toLowerCase()).toContain("no such file");
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
            let DEFAULT_SYSTEM_PROPS: ITestSystemSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_submit_local_file_without_profiles"
                });

                const sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
                DEFAULT_SYSTEM_PROPS = sysProps.getDefaultSystem();
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("should submit a job in an existing valid local file", async () => {
                const response = runCliScript(__dirname + "/__scripts__/submit_valid_local_file_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        __dirname + "/testFileOfLocalJCL.txt",
                        DEFAULT_SYSTEM_PROPS.zosmf.host,
                        DEFAULT_SYSTEM_PROPS.zosmf.port,
                        DEFAULT_SYSTEM_PROPS.zosmf.user,
                        DEFAULT_SYSTEM_PROPS.zosmf.pass
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("jobname");
                expect(response.stdout.toString()).toContain("jobid");
            });
        });
    });

    describe("syntax errors", () => {
        it("should occur if the local file name is missing", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_syntax_missing_file_name.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });

        it("should occur if an extra unknown option is specified", async () => {

            const response = runCliScript(__dirname + "/__scripts__/submit_syntax_invalid_parm.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt"]);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });
    });
});
