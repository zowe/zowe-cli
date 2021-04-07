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
import { stripNewLines } from "../../../../../../__tests__/__src__/TestUtils";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

describe("zosmf list systems", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_list_systems_integration",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/zosmf_list_systems_help.sh", testEnvironment);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail due to invalid status command", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_missing_systems.sh", testEnvironment);
        expect(stripNewLines(response.stderr.toString())).toContain("Command failed due to improper syntax");
    });

});
