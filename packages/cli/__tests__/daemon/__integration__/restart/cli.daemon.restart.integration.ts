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


import { IO, ISystemInfo, ProcessUtils } from "@zowe/core-for-zowe-sdk";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";

import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

describe("daemon restart", () => {
    const rimrafSync = require("rimraf").sync;
    const zoweCmdRegEx = "zowe.*[/|\\\\]cli[/|\\\\]lib[/|\\\\]main.js.* --daemon" + "|" +
    "[/|\\\\]bin[/|\\\\]zowe.* --daemon";

    let exePath: string;
    let pathToBin: string;
    let willRunNodeJsZowe: boolean = true; // is the zowe command that we will run our Node.js script?

    beforeAll(async () => {
        // Create the unique test environment
        testEnvironment = await TestEnvironment.setUp({
            testName: "daemon_restart_integration",
            skipProperties: true
        });

        // determine our current OS
        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();

        // form our tgz file name
        switch (sysInfo.platform) {
            case "darwin":
            case "linux": {
                exePath = "zowe";
                break;
            }
            case "win32": {
                exePath = "zowe.exe";
                break;
            }
            default: {
                exePath = "exeForUnknownOs";
                throw __filename + ": beforeAll: " + sysInfo.platform + " is not a known OS.";
            }
        }

        // form the path to our bin directory, executable, and prebuilds tgz file
        pathToBin = nodeJsPath.resolve(testEnvironment.workingDir, "bin");
        exePath = nodeJsPath.resolve(pathToBin, exePath);

        // Get the zowe program from the PATH that will be used in the test
        const zowePgmInPath: string = which.sync('zowe', { path: testEnvironment.env.PATH });

        // We know that our zowe EXE will be bigger than our zowe scripts
        const maxScriptSize: number = 5000;
        const zowePgmStats = fs.statSync(zowePgmInPath);
        if (zowePgmStats.size >= maxScriptSize) {
            willRunNodeJsZowe = false;
        }
    });

    afterAll(async () => {
        rimrafSync(pathToBin);
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should display the help", async () => {
        if (willRunNodeJsZowe) {
            const response = runCliScript(__dirname + "/__scripts__/daemon_restart_help.sh", testEnvironment);
            const stdoutStr = response.stdout.toString();
            expect(stdoutStr).toContain("COMMAND NAME");
            expect(stdoutStr).toContain("Restart the Zowe CLI daemon.");
            expect(stdoutStr).toContain("USAGE");
            expect(stdoutStr).toContain("zowe daemon restart [options]");
            expect(stdoutStr).toContain("GLOBAL OPTIONS");
            expect(stdoutStr).toContain("--help | -h (boolean)");
            expect(stdoutStr).toContain("EXAMPLES");
            expect(stdoutStr).toContain("Restart daemon:");
            expect(stdoutStr).toContain("$ zowe daemon restart");
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        }
    });

    it("should display message when Node.js zowe is run", async () => {
        if (willRunNodeJsZowe) {
            if (IO.existsSync(pathToBin)) {
                rimrafSync(pathToBin);
            }
            const response = runCliScript(__dirname + "/__scripts__/daemon_restart.sh", testEnvironment);
            const stdoutStr = response.stdout.toString();
            expect(stdoutStr).toContain("Zowe daemon restart is only valid when daemon mode is enabled.");
            expect(response.status).toBe(0);
        }
    });

});
