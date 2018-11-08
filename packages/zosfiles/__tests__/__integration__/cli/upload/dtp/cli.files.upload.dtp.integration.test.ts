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
import { runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

let TEST_ENVIRONMENT: ITestEnvironment;

describe("Upload directory to PDS", () => {

    beforeAll(async () => {

        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "upload_data_set"
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command_upload_dtp_help.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        const helpText = response.stdout.toString();
        expect(helpText).toMatchSnapshot();
    });

    describe("Expected failures", () => {
        it("should fail due to missing local directory name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Argument");
            expect(response.stderr.toString()).toContain("inputdir");
            expect(response.stderr.toString()).toContain("dataSetName");
        });

        it("should fail due to missing mf data set name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtp_dir");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Argument");
            expect(response.stderr.toString()).toContain("dataSetName");
        });

        it("should fail when local directory does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["localDirThatDoesNotExist", "mf.data.set"]);
            expect(stripNewLines(response.stderr.toString())).toContain("no such file or directory, lstat");
            expect(stripNewLines(response.stderr.toString())).toContain("localDirThatDoesNotExist");
        });

    });
});

