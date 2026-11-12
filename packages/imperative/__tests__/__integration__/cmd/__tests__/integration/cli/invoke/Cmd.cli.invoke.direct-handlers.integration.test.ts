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

import { spawnSync } from "child_process";
import { resolve } from "path";
import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
import { ICommandResponse } from "../../../../../../../src/cmd";

describe("cmd-cli direct handler constructors", () => {
    let environment: ITestEnvironment;

    beforeAll(async () => {
        environment = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_direct_handlers"
        });
    });

    const run = (command: string, ...args: string[]) => spawnSync(process.execPath, [
        resolve(__dirname, "../../../../lib/index.js"), "direct-handlers", command, ...args
    ], {
        cwd: environment.workingDir,
        env: { ...process.env, FORCE_COLOR: "0" },
        encoding: "utf8"
    });

    it("should invoke a direct handler through command discovery and Yargs", () => {
        const response = run("single", "--value", "hello");

        expect(response.status).toBe(0);
        expect(response.stderr).toBe("");
        expect(response.stdout).toContain("invocations: 1; value: hello:1");
    });

    it("should return JSON from a direct handler", () => {
        const response = run("single", "--response-format-json");

        expect(response.status).toBe(0);
        const json: ICommandResponse = JSON.parse(response.stdout);
        expect(json.success).toBe(true);
        expect(json.data).toEqual({ invocations: 1, value: "start:1" });
    });

    it("should map responses through mixed handlers and create fresh instances for each chain entry", () => {
        const response = run("mixed-chain", "--response-format-json");

        expect(response.status).toBe(0);
        const json: ICommandResponse = JSON.parse(response.stdout);
        expect(json.success).toBe(true);
        expect(json.data).toEqual({ invocations: 1, value: "start:1:1:1" });
        expect(json.stdout.toString().match(/invocations: 1;/g)).toHaveLength(3);
        expect(json.stdout.toString()).not.toContain("invocations: 2;");
    });

    it("should preserve console output across mixed handlers", () => {
        const response = run("mixed-chain");

        expect(response.status).toBe(0);
        expect(response.stdout).toContain("invocations: 1; value: start:1");
        expect(response.stdout).toContain("invocations: 1; value: start:1:1");
        expect(response.stdout).toContain("invocations: 1; value: start:1:1:1");
    });

    it.each(["single", "mixed-chain"])("should report a process error from %s", (command) => {
        const response = run(command, "--fail", "--response-format-json");

        expect(response.status).toBe(1);
        const json: ICommandResponse = JSON.parse(response.stdout);
        expect(json.success).toBe(false);
        expect(json.error.msg).toBe("Direct handler failed");
        expect(json.stdout.toString()).not.toContain("invocations:");
    });

    it.each(["broken", "broken-chain"])("should report a constructor error from %s", (command) => {
        const response = run(command, "--response-format-json");

        expect(response.status).toBe(1);
        const json: ICommandResponse = JSON.parse(response.stdout);
        expect(json.success).toBe(false);
        expect(json.error.msg).toContain("Could not instantiate the handler BrokenHandler");
        expect(json.error.additionalDetails).toBe("Direct handler constructor failed");
        expect(json.stdout.toString()).not.toContain("invocations:");
    });
});
