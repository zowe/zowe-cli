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
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
const LOCAL_JCL_FILE: string = __dirname + "/__scripts__/job/" + "jcl.txt";

describe("zos-jobs modify job command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_modify_job_command_integration",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("successful response", () => {
        it("should display the help", async () => {
            const response = runCliScript(__dirname + "/__scripts__/job/help.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(
                "Modify the job class or the hold status of a job"
            );
        });
    });
    describe("error handling", () => {
        it("should display an error when jobid is missing", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/missing_jobid.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain(
                "Missing Positional Argument: jobid"
            );
        });

        it("should display an error when command includes conflicting flags", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/conflicting_flags.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain(
                "Syntax Error:\nThe following options conflict (mutually exclusive):\n"+
                "--hold\n--release"
            );
        });

        it("should display an error when command includes an undefined option", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/bogus_flag.sh", TEST_ENVIRONMENT, [LOCAL_JCL_FILE]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain(
                "Command failed due to improper syntax"
            );
        });
    });
});
