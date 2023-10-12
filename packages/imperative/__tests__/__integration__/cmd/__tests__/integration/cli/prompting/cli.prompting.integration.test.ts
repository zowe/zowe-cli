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

import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
import { join } from "path";
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
describe("cmd-cli profile mapping", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_profile_mapping"
        });
    });

    afterEach(() => {
        // delete profiles between tests so that they can be recreated
        require("rimraf").sync(join(TEST_ENVIRONMENT.workingDir, "profiles"));
    });

    // Skip this test on Windows until https://github.com/microsoft/node-pty/issues/437 is fixed
    (process.platform !== "win32" ? it : it.skip)("should prompt the user for a value when the default prompt phrase is specified", (done: any) => {

        const myColor = "army green";
        // for some reason, node-pty won't find "sh" on Windows unless you add .exe
        const shProgram = require("os").platform() === "win32" ? "bash.exe" : "bash";
        const rootDir = __dirname.slice(0, __dirname.indexOf("__tests__"));
        const ptyProcess = require("node-pty")
            .spawn(shProgram, [join(__dirname, "__scripts__", "prompt_for_color.sh")],
                {
                    name: "xterm-color",
                    cols: 80,
                    rows: 30,
                    cwd: TEST_ENVIRONMENT.workingDir,
                    env: {
                        ...process.env,
                        PATH: join(rootDir, "..", "..", ".npm-global", "bin") + ":" + process.env.PATH
                    }
                });

        let output: Buffer = Buffer.alloc(0);

        let colorWritten = false;

        ptyProcess.on("data", (data: string) => {
            output = Buffer.concat([output, Buffer.from(data)]);
            process.stdout.write(data);
            if (!colorWritten && output.toString().indexOf(":") >= 0) {
                ptyProcess.write(myColor + "\r\n");
                colorWritten = true;
                process.stdout.write("wrote color to prompt\n");
            }
        });

        // node-pty crashes on the Jenkins server but works locally on windows and linux
        // we allow an error to be encountered as long as we still saw the expected output
        // since this is the only package that gets us close to an automated test of prompting
        ptyProcess.on("error", (error: any) => {
            process.stdout.write("prompting process encountered an error: " + error);
            expect(output.toString()).toContain("Color: " + myColor);
            ptyProcess.destroy();
            done();
        });
        ptyProcess.on("end", () => {
            process.stdout.write("prompting process ended");
            expect(output.toString()).toContain("Color: " + myColor);
            done();
        });

    });

});
