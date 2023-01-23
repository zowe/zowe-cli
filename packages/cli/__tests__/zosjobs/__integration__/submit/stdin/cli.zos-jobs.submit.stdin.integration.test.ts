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

process.env.FORCE_COLOR = "0";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("zos-jobs submit command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_submit_command",
            skipProperties: true
        });
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/__scripts__/submit_help.sh", TEST_ENVIRONMENT);
        expect(response.status).not.toBe(null); // FIXME
        expect(response.status).toBe(0); // FIXME
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    describe("Syntax errors", () => {
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
