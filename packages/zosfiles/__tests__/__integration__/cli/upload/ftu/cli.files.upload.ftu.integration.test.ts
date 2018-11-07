/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import * as path from "path";
import { runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

let TEST_ENVIRONMENT: ITestEnvironment;

describe("Upload uss file", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "upload_uss_file"
        });

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display upload uss file help", async () => {
        const shellScript = path.join(__dirname, "__scripts__", "command_upload_ftu_help.sh");
        const response = runCliScript(shellScript, TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        const helpText = response.stdout.toString();
        expect(helpText).toMatchSnapshot();
    });

    describe("Expected failures", () => {
        it("should fail due to missing uss file name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_ftu.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Option");
            expect(response.stderr.toString()).toContain("USSFileName");
        });

        it("should fail when local file does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_ftu.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["localFileThatDoesNotExist", "/a/uss/file"]);
            expect(stripNewLines(response.stderr.toString())).toContain("no such file or directory, lstat");
            expect(stripNewLines(response.stderr.toString())).toContain("localFileThatDoesNotExist");
        });
    });
});

