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

import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("zos-tso", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_tso_root_integration"
        });
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/zos-tso_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail with invalid parameter", async () => {
        const response = runCliScript(__dirname + "/__scripts__/invalid_command.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toBe("");
    });

    it("should fail with invalid option", async () => {
        const response = runCliScript(__dirname + "/__scripts__/invalid_option.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toBe("");
    });
});
