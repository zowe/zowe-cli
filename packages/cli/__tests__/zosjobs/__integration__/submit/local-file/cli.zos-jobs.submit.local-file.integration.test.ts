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

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("zos-jobs submit local-file command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_submit_local_file_command",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/__scripts__/submit_local_file_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail if the local file does not exist", () => {
        const response = runCliScript(__dirname + "/__scripts__/submit_invalid_local_file.sh",
            TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString().toLowerCase()).toContain("error");
        expect(response.stderr.toString().toLowerCase()).toContain("no such file");
    });

    describe("syntax errors", () => {
        it("should occur if the local file name is missing", () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_syntax_missing_file_name.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });

        it("should occur if an extra unknown option is specified", () => {
            const relDirname = require("path").relative(TEST_ENVIRONMENT.workingDir, __dirname).replace(/\\/g, "/");
            const response = runCliScript(__dirname + "/__scripts__/submit_syntax_invalid_parm.sh",
                TEST_ENVIRONMENT, [relDirname + "/testFileOfLocalJCL.txt"]);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });

        it("should occur if --wfa and --directory are both specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_syntax_wait_active_and_directory.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt"]);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });

        it("should occur if --wfa and --vasc are both specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_syntax_wait_active_and_vasc.sh",
                TEST_ENVIRONMENT, [__dirname + "/testFileOfLocalJCL.txt"]);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });
    });
});
