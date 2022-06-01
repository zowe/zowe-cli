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
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("Download Dataset Matching", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "download_data_set_matching",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", () => {
        const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm_help.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail due to missing pattern", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_dsm.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("pattern");
        expect(response.stderr.toString()).toContain("Missing Positional");
    });

    it("should fail due to specifying both binary and record", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_dsm.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["test", "--binary", "--record"]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("following options conflict");
        expect(response.stderr.toString()).toContain("--record");
        expect(response.stderr.toString()).toContain("--binary");
    });

    it("should fail due to specifying both extension and extensionMap", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_dsm.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["test", "--extension", "--extension-map"]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("following options conflict");
        expect(response.stderr.toString()).toContain("--extension");
        expect(response.stderr.toString()).toContain("--extension-map");
    });
});
