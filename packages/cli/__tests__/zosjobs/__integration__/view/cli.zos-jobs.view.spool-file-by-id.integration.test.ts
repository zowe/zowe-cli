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

import { ITestEnvironment, runCliScript } from "../../../../../../__tests__/__packages__/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("zos-jobs view spool-file-by-id command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_view_spool_file_by_id_command",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.status).toBe(0);
    });

    describe("syntax errors", () => {
        it("should occur if the jobid and spool file id are missing", async () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/missing_jobid_and_spool_id.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
            expect(response.status).toBe(1);
        });

        it("should occur if the spool file id is missing", async () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/missing_spool_id.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
            expect(response.status).toBe(1);
        });
    });

});
