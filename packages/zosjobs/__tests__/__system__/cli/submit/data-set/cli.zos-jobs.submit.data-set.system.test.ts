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

import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { List } from "../../../../../../zosfiles/src/api/methods/list";
import { Session } from "@brightside/imperative";

process.env.FORCE_COLOR = "0";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

let account: string;
let defaultSystem: ITestSystemSchema;
let systemProps: TestProperties;
let jclMember: string;
let psJclDataSet: string;
let REAL_SESSION: Session;
describe("zos-jobs submit data-set command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_submit_command",
            tempProfileTypes: ["zosmf"]
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        account = defaultSystem.tso.account;
        jclMember = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
        psJclDataSet = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14PSDataSet;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Live system tests", () => {
        it("should submit a job in an existing valid data set from a PDS member ", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_data_set.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
        });

        it("should submit a job in an existing valid data set from a physical sequential data set", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_data_set_no_member.sh",
                TEST_ENVIRONMENT, [psJclDataSet]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
        });

        it("should submit a job in an existing valid data set with 'view-all-spool-content' option", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_data_set_with_vasc.sh",
                TEST_ENVIRONMENT, [psJclDataSet, "--vasc"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Spool file");
            expect(response.stdout.toString()).toContain("JES2");
        });

        it("should submit a job in an existing valid data set with 'directory' option", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_data_set_with_directory.sh",
                TEST_ENVIRONMENT, [psJclDataSet, "--directory", "./"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
            expect(response.stdout.toString()).toContain("Successfully downloaded output to ./");
            expect(new RegExp("JOB\\d{5}", "g").test(response.stdout.toString())).toBe(true);
        });

        it("should submit a job in an existing valid data set with 'volume' option", async () => {
            const dataSets = await List.dataSet(REAL_SESSION, psJclDataSet, {attributes: true});
            expect(dataSets.apiResponse.items).toBeDefined();
            const volume = dataSets.apiResponse.items[0].vol; // use the volume of the existing data set
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_data_set_with_volume.sh",
                TEST_ENVIRONMENT, [psJclDataSet, "--volume", volume]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
            expect(new RegExp("JOB\\d{5}", "g").test(response.stdout.toString())).toBe(true);
        });

        it("should submit a job in an existing valid data set (using aliases)", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_data_set_alias.sh",
                TEST_ENVIRONMENT, [jclMember]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
        });

        it("should fail if the data set does not exist ", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_invalid_data_set.sh",
                TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stderr.toString().toLowerCase()).toContain("data");
            expect(response.stderr.toString().toLowerCase()).toContain("set");
            expect(response.stderr.toString().toLowerCase()).toContain("found");
            expect(response.stderr.toString().toLowerCase()).toContain("does.not.exist");
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
            let DEFAULT_SYSTEM_PROPS: ITestSystemSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_submit_data_set_without_profiles"
                });

                const sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
                DEFAULT_SYSTEM_PROPS = sysProps.getDefaultSystem();
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("should submit a job in an existing valid data set from a PDS member", async () => {
                const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                // if API Mediation layer is being used (basePath has a value) then
                // set an ENVIRONMENT variable to be used by zowe.
                if (DEFAULT_SYSTEM_PROPS.zosmf.basePath != null) {
                    TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = DEFAULT_SYSTEM_PROPS.zosmf.basePath;
                }

                const response = runCliScript(__dirname + "/__scripts__/submit_valid_data_set_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosjobs.iefbr14Member,
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

});
