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

describe("Upload local dir to uss dir", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "upload_local_dir_to_uss_dir"
        });

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command_upload_dtu_help.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        const helpText = response.stdout.toString();
        expect(helpText).toMatchSnapshot();
    });

    describe("Expected failures", () => {
        it("should fail due to missing input directory", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtu.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Argument");
            expect(response.stderr.toString()).toContain("inputDir");
            expect(response.stderr.toString()).toContain("USSDir");
        });

        it("should fail due to missing uss directory", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtu.sh");
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtu_dir");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Argument");
            expect(response.stderr.toString()).toContain("USSDir");
        });

        it("should fail when local directory does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtu.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["localDirThatDoesNotExist", "/a/uss/dir"]);
            expect(stripNewLines(response.stderr.toString())).toContain("no such file or directory, lstat");
            expect(stripNewLines(response.stderr.toString())).toContain("localDirThatDoesNotExist");
        });
    });
});

