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
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";

process.env.FORCE_COLOR = "0";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

let account: string;
let defaultSystem: ITestSystemSchema;
let systemProps: TestProperties;
let jclMember: string;
let psJclDataSet: string;
describe("zos-jobs submit data-set command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_submit_command",
            tempProfileTypes: ["zosmf"]
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        account = defaultSystem.tso.account;
        jclMember = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
        psJclDataSet = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14PSDataSet;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("help", () => {
        it("should not change", () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_data_set_help.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
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
    });

    describe("syntax errors", () => {
        it("should occur if the data set name is missing", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_syntax_missing_data_set.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });

        it("should occur if an extra unknown option is specified", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_syntax_invalid_parm.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });
    });
});
