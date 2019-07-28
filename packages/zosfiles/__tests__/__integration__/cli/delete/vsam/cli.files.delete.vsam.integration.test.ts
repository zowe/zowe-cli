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

import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("Delete VSAM Data Set", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_delete_vsam_data_set",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    it("should display delete vsam help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/delete_vsam_help.sh",
            TEST_ENVIRONMENT);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail deleting a data set due to missing data set name", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
            TEST_ENVIRONMENT, [""]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("dataSetName");
        expect(response.stderr.toString()).toContain("Missing Positional");
    });

    it("should fail deleting a data set without specifying --for-sure", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
            TEST_ENVIRONMENT, ["ds.name"]);

        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("--for-sure");
        expect(response.stderr.toString()).toContain("Missing Required Option");
    });

});
