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

import * as nodeJsPath from "path";

import { IO, ProcessUtils, ISystemInfo } from "@zowe/imperative";

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

describe("Zowe native executable", () => {
    let zoweExePath: string;
    let canTestExe: boolean = true;

    beforeAll(async () => {
        // Create the unique test environment
        testEnvironment = await TestEnvironment.setUp({
            testName: "zowe_exe_integration",
            skipProperties: true
        });

        // determine executable file extension for our current OS
        let exeExt: string;
        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();
        if (sysInfo.platform == "win32") {
            exeExt = ".exe";
        } else {
            exeExt = "";
        }

        // Form the path name to our executable.
        const zoweExeGrandParentDir: string = nodeJsPath.normalize(__dirname + "/../../../../../zowex/target");
        zoweExePath = nodeJsPath.normalize(zoweExeGrandParentDir + "/release/zowe" + exeExt);
        if (!IO.existsSync(zoweExePath)) {
            zoweExePath = nodeJsPath.normalize(zoweExeGrandParentDir + "/debug/zowe" + exeExt);
            if (!IO.existsSync(zoweExePath)) {
                canTestExe = false;
                zoweExePath = "./NoZoweExeExists";
            }
        }
    });

    it("should display its version number", async () => {
        if (canTestExe) {
            const response = runCliScript(
                __dirname + "/__scripts__/run_zowe_exe.sh", testEnvironment,
                [zoweExePath, "--version-exe"]
            );
            expect(response.stdout.toString()).toMatch(/[0-9]\.[0-9]\.[0-9]/);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        } else {
            // just skip this executable test
            expect(true).toBe(true);
        }
    });
});
