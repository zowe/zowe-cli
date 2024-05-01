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

/* eslint-disable jest/expect-expect */
import * as fs from "fs";
import * as path from "path";
import { runCliScript } from "../../../../../../src/TestUtil";
import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
import { TestLogger } from "../../../../../../src/TestLogger";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

// Log directories
const APP_LOG = path.join("logs", "imperative-test-cli.log");
const IMP_LOG = path.join("logs", "imperative.log");

describe("imperative-test-cli test masking command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_masking_command"
        });
        process.env["IMPERATIVE_TEST_CLI_APP_LOG_LEVEL"] = "ALL";
        process.env["IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL"] = "ALL";
        TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);
        runCliScript(__dirname + "/../config/init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--no-prompt"]);
        runCliScript(__dirname + "/../config/set/__scripts__/set_secure.sh", TEST_ENVIRONMENT.workingDir,
            ["profiles.secured.profiles.secure_profile.properties.info", "secret"]);
    });

    const _logPrefix = (_log: string, level: string) => {
        return `Test-Masking: ${_log} logger: ${level} message: `;
    };

    const _testHelper = (cmdInput: string, envValue: string) => {
        const _testMsg = `${envValue === "FALSE" ? "secret" : "****"}`;
        const response = runCliScript(__dirname + "/__scripts__/test_masking.sh",
            TEST_ENVIRONMENT.workingDir, [cmdInput], {
                IMPERATIVE_TEST_CLI_APP_MASK_OUTPUT: envValue,
            });

        const stderr = cmdInput.indexOf("--rfj") > 0 ? response.stdout.toString() : response.stderr.toString();

        expect(response.stdout.toString()).toContain(_logPrefix("console", "log") + _testMsg);
        expect(response.stdout.toString()).toContain(_logPrefix("console", "prompt") + _testMsg);
        expect(stderr).toContain(_logPrefix("console", "error") + _testMsg);
        expect(stderr).toContain(_logPrefix("console", "errorHeader") + _testMsg);

        _testLogs("app");
        _testLogs("imperative");
    };

    const _testLogs = (_log: string) => {
        const logPath = path.join(TEST_ENVIRONMENT.workingDir, _log === "app" ? APP_LOG : IMP_LOG);
        expect(fs.existsSync(logPath)).toBe(true);
        const logContents = fs.readFileSync(logPath).toString();
        for (const level of ["trace", "debug", "info", "warn", "error", "fatal"]) {
            expect(logContents).toContain(`[${level.toUpperCase()}]`);
            expect(logContents).toContain(_logPrefix(_log, level) + level === "trace" ? "secret" : "****");
        }
    };

    it("should mask only what is required to be masked when _APP_MASK_OUTPUT is FALSE", () => {
        _testHelper("secret", "FALSE");
    });

    it("should mask only what is required to be masked when _APP_MASK_OUTPUT is FALSE with --rfj", () => {
        _testHelper("secret --rfj", "FALSE");
    });

    it("should mask only what is required to be masked when _APP_MASK_OUTPUT is NOT FALSE", () => {
        _testHelper("secret", "random value");
    });

    it("should mask only what is required to be masked when _APP_MASK_OUTPUT is NOT FALSE with --rfj", () => {
        _testHelper("secret --rfj", "random value");
    });
});
