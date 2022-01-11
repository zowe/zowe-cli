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

import * as fs from "fs";
import * as nodeJsPath from "path";
import * as which from "which";
import { exec } from "child_process";


import { IO, ISystemInfo, ProcessUtils } from "@zowe/imperative";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";

import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

describe("daemon disable", () => {
    const rimraf = require("rimraf").sync;
    const fakeExeContent = "This is not a real executable";

    let exePath: string;
    let pathToBin: string;
    let willRunNodeJsZowe: boolean = true; // is the zowe command that we will run our Node.js script?

    beforeAll(async () => {
        // Create the unique test environment
        testEnvironment = await TestEnvironment.setUp({
            testName: "daemon_disable_integration",
            skipProperties: true
        });

        // determine our current OS
        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();

        // form our tgz file name
        let tgzFileName = "zowe-";
        switch (sysInfo.platform) {
            case "darwin": {
                tgzFileName += "macos.tgz";
                exePath = "zowe";
                break;
            }
            case "linux": {
                tgzFileName += "linux.tgz";
                exePath = "zowe";
                break;
            }
            case "win32": {
                tgzFileName += "windows.tgz";
                exePath = "zowe.exe";
                break;
            }
            default: {
                tgzFileName += "unknownOs.tgz";
                exePath = "exeForUnknownOs";
                throw "cli.daemon.disable.integration.test.ts: beforeAll: " + sysInfo.platform + " is not a known OS.";
            }
        }

        // form the path to our bin directory, executable, and prebuilds tgz file
        const tgzResourcePath = nodeJsPath.resolve(__dirname, "../../__resources__", tgzFileName);
        pathToBin = nodeJsPath.resolve(testEnvironment.workingDir, "bin");
        exePath = nodeJsPath.resolve(pathToBin, exePath);

        // Get the zowe program from the PATH that will be used in the test
        const zowePgmInPath: string = which.sync('zowe', { path: testEnvironment.env.PATH });

        // We know that our zowe EXE will be bigger than our zowe scripts
        const maxScriptSize: number = 2000;
        const zowePgmStats = fs.statSync(zowePgmInPath);
        if (zowePgmStats.size >= maxScriptSize) {
            willRunNodeJsZowe = false;
        }
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should display the help", async () => {
        /* Our EXE will spawn a daemon to get the help. We do not want a daemon as part of this test suite.
         * We just want to confirm that our enable help is reasonable.
         */
        if (willRunNodeJsZowe) {
            const response = runCliScript(__dirname + "/__scripts__/daemon_disable_help.sh", testEnvironment);
            const stdoutStr = response.stdout.toString();
            expect(stdoutStr).toContain("COMMAND NAME");
            expect(stdoutStr).toContain("Disables daemon-mode operation of the Zowe CLI.");
            expect(stdoutStr).toContain("USAGE");
            expect(stdoutStr).toContain("zowe daemon disable [options]");
            expect(stdoutStr).toContain("GLOBAL OPTIONS");
            expect(stdoutStr).toContain("--help  | -h (boolean)");
            expect(stdoutStr).toContain("EXAMPLES");
            expect(stdoutStr).toContain("Disable daemon-mode:");
            expect(stdoutStr).toContain("$ zowe daemon disable");
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        }
    });

    it("should succeed when no EXE exists", async () => {
        if (willRunNodeJsZowe) {
            if (IO.existsSync(pathToBin)) {
                rimraf(pathToBin);
            }
            const response = runCliScript(__dirname + "/__scripts__/daemon_disable.sh", testEnvironment);
            const stdoutStr = response.stdout.toString();
            expect(stdoutStr).toContain("Zowe CLI daemon mode is disabled.");
            expect(response.status).toBe(0);
        }
    });

    it("should delete an existing EXE", async () => {
        if (willRunNodeJsZowe) {
            if (!IO.existsSync(pathToBin)) {
                IO.createDirSync(pathToBin);
            }
            if (!IO.existsSync(exePath)) {
                IO.createFileSync(exePath);
            }
            const response = runCliScript(__dirname + "/__scripts__/daemon_disable.sh", testEnvironment);
            const stdoutStr = response.stdout.toString();
            expect(stdoutStr).toContain("Zowe CLI daemon mode is disabled.");
            expect(IO.existsSync(exePath)).toBe(false);
            expect(response.status).toBe(0);
        }
    });

    it("should succeed when no daemon is running", async () => {
        if (willRunNodeJsZowe) {
            // find any running daemon
            const findProc = require('find-process');
            const procArray = await findProc('name', 'node', true);

            // match and kill any running Zowe daemon
            const zoweCmdRegEx = "@zowe[/|\\\\]cli[/|\\\\]lib[/|\\\\]main.js";
            for (const nextProc of procArray) {
                if (nextProc.cmd.match(zoweCmdRegEx) && nextProc.cmd.includes("--daemon")) {
                    process.kill(nextProc.pid, "SIGINT");
                }
            }

            const response = runCliScript(__dirname + "/__scripts__/daemon_disable.sh", testEnvironment);
            const stdoutStr = response.stdout.toString();
            expect(stdoutStr).toContain("Zowe CLI daemon mode is disabled.");
            expect(IO.existsSync(exePath)).toBe(false);
            expect(response.status).toBe(0);
        }
    });

    it("should stop a running zowe daemon", async () => {
        if (willRunNodeJsZowe) {
            // start a daemon
            exec("zowe --daemon");

            // run disable
            const response = runCliScript(__dirname + "/__scripts__/daemon_disable.sh", testEnvironment);
            const stdoutStr = response.stdout.toString();
            expect(stdoutStr).toContain("Zowe CLI daemon mode is disabled.");
            expect(IO.existsSync(exePath)).toBe(false);
            expect(response.status).toBe(0);

            // match any running Zowe daemon
            const findProc = require('find-process');
            const procArray = await findProc('name', 'node', true);
            const zoweCmdRegEx = "@zowe[/|\\\\]cli[/|\\\\]lib[/|\\\\]main.js";
            for (const nextProc of procArray) {
                if (nextProc.cmd.match(zoweCmdRegEx) && nextProc.cmd.includes("--daemon")) {
                    expect("we should not find a daemon").toContain("so the disable command failed.");
                }
            }
        }
    });
});
