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

import { IO, ISystemInfo, ProcessUtils } from "@zowe/imperative";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";

import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

describe("daemon enable", () => {
    const rimraf = require("rimraf").sync;
    const fakeExeContent = "This is not a real executable";
    const exeCantRunDaemonMsg1: string = "You cannot run this 'daemon' command while using the Zowe CLI native executable.";
    const exeCantRunDaemonMsg2: string = "Copy and paste the following command instead:";
    const EXIT_CODE_CANT_RUN_DAEMON_CMD: number = 107;

    let exePath: string;
    let pathToBin: string;
    let preBldTgzPath: string;

    // is the zowe command that we will run an executable?
    const isZoweExe = (): boolean => {
        // Get the zowe program from the PATH that will be used in the test
        const zowePgmInPath: string = which.sync('zowe', { path: testEnvironment.env.PATH });

        // We know that our zowe EXE will be bigger than our zowe scripts
        const maxScriptSize: number = 2000;
        const zowePgmStats = fs.statSync(zowePgmInPath);
        if (zowePgmStats.size >= maxScriptSize) {
            return true;
        }
        return false;
    };


    beforeAll(async () => {
        // Create the unique test environment
        testEnvironment = await TestEnvironment.setUp({
            testName: "daemon_enable_integration",
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
                throw "cli.daemon.enable.integration.test.ts: beforeAll: " + sysInfo.platform + " is not a known OS.";
            }
        }

        // form the path to our bin directory, executable, and prebuilds tgz file
        const tgzResourcePath = nodeJsPath.resolve(__dirname, "../../__resources__", tgzFileName);
        const preBldDir = nodeJsPath.resolve(__dirname, "../../../../prebuilds");
        preBldTgzPath = nodeJsPath.resolve(preBldDir, tgzFileName);
        pathToBin = nodeJsPath.resolve(testEnvironment.workingDir, "bin");
        exePath = nodeJsPath.resolve(pathToBin, exePath);

        // copy a fake tgz file from resources to our prebuilds directory for testing
        if (!IO.existsSync(preBldDir)) {
            IO.createDirSync(preBldDir);
        }
        if (!IO.existsSync(preBldTgzPath)) {
            fs.copyFileSync(tgzResourcePath, preBldTgzPath);
        }
    });

    beforeEach(async () => {
        // Remove any existing bin directory
        rimraf(pathToBin);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should display the help", async () => {
        /* Our EXE will spawn a daemon to get the help. We do not want a daemon as part of this test suite.
         * We just want to confirm that our enable help is reasonable.
         */
        if (!isZoweExe()) {
            const response = runCliScript(__dirname + "/__scripts__/daemon_enable_help.sh", testEnvironment);
            const stdoutStr = response.stdout.toString();
            expect(stdoutStr).toContain("COMMAND NAME");
            expect(stdoutStr).toContain("Enables daemon-mode operation of the Zowe CLI.");
            expect(stdoutStr).toContain("USAGE");
            expect(stdoutStr).toContain("zowe daemon enable [options]");
            expect(stdoutStr).toContain("GLOBAL OPTIONS");
            expect(stdoutStr).toContain("--help  | -h (boolean)");
            expect(stdoutStr).toContain("EXAMPLES");
            expect(stdoutStr).toContain("Enable daemon-mode:");
            expect(stdoutStr).toContain("$ zowe daemon enable");
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        }
    });

    it("should fail when the tgz file does not exist", async () => {
        // temporarily remove the desired tgz file - keep an eye open for impact on parallel tests
        const tempRenamedTgz = preBldTgzPath + "_temp_rename";
        fs.renameSync(preBldTgzPath, tempRenamedTgz);

        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);

        // restore our tgz file for other tests
        fs.renameSync(tempRenamedTgz, preBldTgzPath);

        const stdoutStr = response.stdout.toString();
        if (isZoweExe()) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Failed to enable Zowe CLI daemon mode.");
            expect(stdoutStr).toContain(`The zip file for your OS executable does not exist: ${preBldTgzPath}`);
            expect(response.status).toBe(1);
        }
        expect(response.stderr.toString()).toBe("");
    });

    it("should fail if a bin file exists", async () => {
        fs.writeFileSync(pathToBin, "not a directory");
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        const stdoutStr = response.stdout.toString();
        if (isZoweExe()) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Failed to enable Zowe CLI daemon mode.");
            expect(stdoutStr).toContain(`The existing file '${pathToBin}' must be a directory.`);
            expect(response.status).toBe(1);
        }
        expect(response.stderr.toString()).toBe("");
    });

    it("should place exe in a new bin dir", async () => {
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        const stdoutStr = response.stdout.toString();
        if (isZoweExe()) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Zowe CLI daemon mode enabled");
            expect(stdoutStr).toContain("Zowe CLI native executable version =");
            expect(IO.existsSync(exePath)).toBe(true);
            expect(response.status).toBe(0);
        }
        expect(response.stderr.toString()).toBe("");
    });

    it("should place exe in an existing bin dir", async () => {
        fs.mkdirSync(pathToBin, 0o755);
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        const stdoutStr = response.stdout.toString();
        if (isZoweExe()) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Zowe CLI daemon mode enabled");
            expect(stdoutStr).toContain("Zowe CLI native executable version =");
            expect(IO.existsSync(exePath)).toBe(true);
            expect(response.status).toBe(0);
        }
        expect(response.stderr.toString()).toBe("");
    });

    it("should overwite an existing exe", async () => {
        const fakeExeContent = "This is not a real executable";
        fs.mkdirSync(pathToBin, 0o755);
        fs.writeFileSync(exePath, fakeExeContent);
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        const stdoutStr = response.stdout.toString();
        if (isZoweExe()) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Zowe CLI daemon mode enabled");
            expect(IO.existsSync(exePath)).toBe(true);

            // our test tgz file is more than 10 bytes larger than this fake tgz
            const exeStats = fs.statSync(exePath);
            expect(exeStats.size).toBeGreaterThan(fakeExeContent.length + 10);
            expect(response.status).toBe(0);
        }
        expect(response.stderr.toString()).toBe("");
    });

    it("should identify that bin is not on the PATH", async () => {
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        const stdoutStr = response.stdout.toString();
        if (isZoweExe()) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Zowe CLI daemon mode enabled");
            expect(stdoutStr).toContain("Zowe CLI native executable version =");
            expect(stdoutStr).toContain(`Add '${pathToBin}' to your PATH`);
            expect(stdoutStr).toContain("Otherwise, you will continue to run the classic Zowe CLI interpreter");
            expect(IO.existsSync(exePath)).toBe(true);
            expect(response.status).toBe(0);
        }
        expect(response.stderr.toString()).toBe("");
    });

    it("should say nothing when bin is already on the PATH", async () => {
        /* TODO: Remove comment
        const pathOrig = testEnvironment.env["PATH"];
        testEnvironment.env["PATH"] = pathToBin + nodeJsPath.delimiter + testEnvironment.env["PATH"];
        */
        const weRanOurExe = isZoweExe();
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        // TODO: Remove comment: testEnvironment.env["PATH"] = pathOrig;

        const stdoutStr = response.stdout.toString();
        if (weRanOurExe) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Zowe CLI daemon mode enabled");
            expect(stdoutStr).toContain("Zowe CLI native executable version =");
            expect(stdoutStr).not.toContain(`Add '${pathToBin}' to your PATH`);
            expect(IO.existsSync(exePath)).toBe(true);
            expect(response.status).toBe(0);
        }
        expect(response.stderr.toString()).toBe("");
    });

    it("should identify that ZOWE_USE_DAEMON is set to 'no'", async () => {
        // TODO: Remove comment: testEnvironment.env["ZOWE_USE_DAEMON"] = "no";
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        // TODO: Remove comment: delete testEnvironment.env.ZOWE_USE_DAEMON;

        const stdoutStr = response.stdout.toString();
        if (isZoweExe()) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Zowe CLI daemon mode enabled");
            expect(stdoutStr).toContain("Zowe CLI native executable version =");
            expect(stdoutStr).toContain("Your ZOWE_USE_DAEMON environment variable is set to 'no'");
            expect(stdoutStr).toContain("You must remove it, or set it to 'yes' to use daemon mode");
            expect(IO.existsSync(exePath)).toBe(true);
            expect(response.status).toBe(0);
        }
        expect(response.stderr.toString()).toBe("");
    });

    it("should say nothing when ZOWE_USE_DAEMON is unset", async () => {
        delete testEnvironment.env.ZOWE_USE_DAEMON;
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        const stdoutStr = response.stdout.toString();
        if (isZoweExe()) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Zowe CLI daemon mode enabled");
            expect(testEnvironment.env["ZOWE_USE_DAEMON"]).toBeFalsy();
            expect(stdoutStr).not.toContain("Your ZOWE_USE_DAEMON environment variable is set to");
            expect(IO.existsSync(exePath)).toBe(true);
            expect(response.status).toBe(0);
        }
        expect(response.stderr.toString()).toBe("");
    });

    it("should say nothing when ZOWE_USE_DAEMON is set to 'yes'", async () => {
        // TODO: Remove comment: testEnvironment.env["ZOWE_USE_DAEMON"] = "yes";
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        // TODO: Remove comment: delete testEnvironment.env.ZOWE_USE_DAEMON;

        const stdoutStr = response.stdout.toString();
        if (isZoweExe()) {
            expect(stdoutStr).toContain(exeCantRunDaemonMsg1);
            expect(stdoutStr).toContain(exeCantRunDaemonMsg2);
            expect(response.status).toBe(EXIT_CODE_CANT_RUN_DAEMON_CMD);
        } else {
            expect(stdoutStr).toContain("Zowe CLI daemon mode enabled");
            expect(stdoutStr).not.toContain("Your ZOWE_USE_DAEMON environment variable is set to");
            expect(IO.existsSync(exePath)).toBe(true);
            expect(response.status).toBe(0);
        }
        expect(response.stderr.toString()).toBe("");
    });
});
