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

import * as path from "path";
import { ITestEnvironment, runCliScript } from "../../../../../../../__tests__/__packages__/ts-cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("Upload file to data set", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "upload_data_set_integration",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command_upload_ftds_help.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        const helpText = response.stdout.toString();
        expect(helpText).toMatchSnapshot();
    });

    describe("Expected failures", () => {
        it("should fail due to missing data set name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_ftds.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Argument");
            expect(response.stderr.toString()).toContain("dataSetName");
        });

        it("should fail when local file does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_ftds.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["localFileThatDoesNotExist", "data.set.name"]);
            expect(stripNewLines(response.stderr.toString())).toContain("no such file or directory, lstat");
            expect(stripNewLines(response.stderr.toString())).toContain("localFileThatDoesNotExist");
        });

    });
});

