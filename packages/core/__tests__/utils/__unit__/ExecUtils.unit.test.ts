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

import * as spawn from "cross-spawn";
import { ExecUtils } from "../../utilities";

jest.mock("cross-spawn");
jest.mock("opener");

describe("ExecUtils tests", () => {
    describe("spawnAndGetOutput", () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it("returns stdout if command succeeds", () => {
            const message = "Hello world!";
            const options: any = { cwd: __dirname };
            const stdoutBuffer = Buffer.from(message + "\n");
            jest.spyOn(spawn, "sync").mockReturnValueOnce({
                status: 0,
                stdout: stdoutBuffer
            } as any);
            const execOutput = ExecUtils.spawnAndGetOutput("echo", [message], options);
            expect(spawn.sync).toHaveBeenCalledWith("echo", [message], options);
            expect(execOutput).toBe(stdoutBuffer);
        });

        it("throws error if command fails and returns error object", () => {
            const filename = "invalid.txt";
            const errMsg = `cat: ${filename}: No such file or directory`;
            jest.spyOn(spawn, "sync").mockReturnValueOnce({
                error: new Error(errMsg)
            } as any);
            let caughtError: any;
            try {
                ExecUtils.spawnAndGetOutput("cat", [filename]);
            } catch (error) {
                caughtError = error;
            }
            expect(spawn.sync).toHaveBeenCalledWith("cat", [filename], undefined);
            expect(caughtError.message).toBe(errMsg);
        });

        it("throws error if command fails with non-zero status", () => {
            const filename = "invalid.txt";
            const stderrBuffer = Buffer.from(`cat: ${filename}: No such file or directory\n`);
            jest.spyOn(spawn, "sync").mockReturnValueOnce({
                status: 1,
                stderr: stderrBuffer
            } as any);
            let caughtError: any;
            try {
                ExecUtils.spawnAndGetOutput("cat", [filename]);
            } catch (error) {
                caughtError = error;
            }
            expect(spawn.sync).toHaveBeenCalledWith("cat", [filename], undefined);
            expect(caughtError.message).toBe(`Command failed: cat ${filename}\n${stderrBuffer.toString()}`);
        });
    });
});
