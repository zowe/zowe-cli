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

import { ITestEnvironment } from "./../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "./../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "./../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let IEFBR14_JCL: string;

describe("zos-jobs download output command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_download_output_command",
            tempProfileTypes: ["zosmf"]
        });
        IEFBR14_JCL = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
    });

    describe("help", () => {
        it("should not have changed", async () => {
            const response = runCliScript(__dirname + "/__scripts__/download-output/help.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("error handling", () => {
        it("should display an error when jobid is missing", () => {
            const response = runCliScript(__dirname + "/__scripts__/download-output/missing_jobid.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });

        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/download-output/not_found.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("Obtaining job info for a single job id JOB00000 on");
            expect(response.stderr.toString()).toContain("failed: Job not found");
        });
    });

    describe("output", () => {
        it("should download all spool files of a job", () => {
            const outdir: string = TEST_ENVIRONMENT.workingDir + "/output/JES2";
            const response = runCliScript(__dirname + "/__scripts__/download-output/download.sh",
                TEST_ENVIRONMENT, [IEFBR14_JCL]);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(fs.existsSync(`${outdir}/JESMSGLG.txt`)).toBeTruthy();
            expect(fs.existsSync(`${outdir}/JESJCL.txt`)).toBeTruthy();
            expect(fs.existsSync(`${outdir}/JESYSMSG.txt`)).toBeTruthy();
            expect(response.stdout.toString()).toContain("Successfully downloaded");
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
            let DEFAULT_SYSTEM_PROPS: ITestSystemSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_download_output_without_profiles"
                });

                const systemProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
                DEFAULT_SYSTEM_PROPS = systemProps.getDefaultSystem();
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("should download all spool files of a job", async () => {
                const outdir: string = TEST_ENVIRONMENT.workingDir + "/output/JES2";
                const response = runCliScript(__dirname + "/__scripts__/download-output/download_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                    [
                        IEFBR14_JCL,
                        DEFAULT_SYSTEM_PROPS.zosmf.host,
                        DEFAULT_SYSTEM_PROPS.zosmf.port,
                        DEFAULT_SYSTEM_PROPS.zosmf.user,
                        DEFAULT_SYSTEM_PROPS.zosmf.pass
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(fs.existsSync(`${outdir}/JESMSGLG.txt`)).toBeTruthy();
                expect(fs.existsSync(`${outdir}/JESJCL.txt`)).toBeTruthy();
                expect(fs.existsSync(`${outdir}/JESYSMSG.txt`)).toBeTruthy();
                expect(response.stdout.toString()).toContain("Successfully downloaded");
            });
        });
    });
});
