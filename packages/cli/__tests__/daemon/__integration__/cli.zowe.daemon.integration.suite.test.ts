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

/* Our daemon-related tests create a TGZ for our EXE, which should be removed
 * after testing. These tests also create and remove an EXE file in our bin
 * directory. The file creations and deletions create problems when the tests
 * are run in parallel. By placing the daemon tests within this top-level
 * describe (thus contining the tests in a single file) the tests are serialized.
 */

import * as nodeJsPath from "path";
import * as tar from "tar";
import { IO, ProcessUtils, ISystemInfo } from "@zowe/imperative";

describe("Zowe daemon suite", () => {
    const rimrafSync = require("rimraf").sync;

    let prebuildsDir: string;
    let zoweExePath: string;
    let zoweExeDirPath: string;
    let zoweExeTgzPath: string;
    let zoweExeFileNm: string;

    // establish path names and record whether we are running our EXE or node.js script
    beforeAll(async () => {
        // determine executable file name and TGZ path for our current OS
        const zoweRootDir: string = nodeJsPath.normalize(__dirname + "/../../../../..");
        prebuildsDir = nodeJsPath.normalize(zoweRootDir + "/packages/cli/prebuilds");
        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();
        switch (sysInfo.platform) {
            case "darwin": {
                zoweExeFileNm = "zowe";
                zoweExeTgzPath = nodeJsPath.resolve(prebuildsDir, "zowe-macos.tgz");
                break;
            }
            case "linux": {
                zoweExeFileNm = "zowe";
                zoweExeTgzPath = nodeJsPath.resolve(prebuildsDir, "zowe-linux.tgz");
                break;
            }
            case "win32": {
                zoweExeFileNm = "zowe.exe";
                zoweExeTgzPath = nodeJsPath.resolve(prebuildsDir, "zowe-windows.tgz");
                break;
            }
            default: {
                zoweExeFileNm = "exeForUnknownOs";
                zoweExeTgzPath += "unknownOs.tgz";
                throw "cli.zowe.daemon.integration.suite.test.ts: beforeAll: " +
                    sysInfo.platform + " is not a known OS.";
            }
        }

        // Form the path name to our executable.
        zoweExeDirPath = nodeJsPath.normalize(zoweRootDir + "/zowex/target/release");
        zoweExePath = nodeJsPath.resolve(zoweExeDirPath, zoweExeFileNm);
        if (!IO.existsSync(zoweExePath)) {
            zoweExeDirPath = nodeJsPath.normalize(zoweRootDir + "/zowex/target/debug");
            zoweExePath = nodeJsPath.resolve(zoweExeDirPath, zoweExeFileNm);
            if (!IO.existsSync(zoweExePath)) {
                zoweExePath = "./NoZoweExeExists";
            }
        }

        // Remove any existing prebuilds directory
        rimrafSync(prebuildsDir);

        // create our prebuilds directory
        IO.createDirSync(prebuildsDir);

        // tar our EXE into a TGZ for this platform, so that we can extract it in tests
        tar.create({
            sync: true,
            gzip: true,
            cwd: zoweExeDirPath,
            file: zoweExeTgzPath
        }, [zoweExeFileNm]);
    });

    afterAll(async () => {
        // Remove any existing prebuilds directory
        rimrafSync(prebuildsDir);
    });

    // run all of our daemon-related tests
    require("./cli.zowe.exe.integration");
    require("./enable/cli.daemon.enable.integration");
    require("./disable/cli.daemon.disable.integration");
});
