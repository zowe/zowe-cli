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

import { runCliScript } from "../../../../../../src/TestUtil";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import * as fs from "fs";
import { TestLogger } from "../../../../../../src/TestLogger";
import { LoggerConfigBuilder } from "../../../../../../../src";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

// Log directories
const APP_LOGS_DIR = "/imperative-test-cli/logs/";
const APP_LOG = APP_LOGS_DIR + "imperative-test-cli.log";
const IMP_LOGS_DIR = "/imperative/logs/";
const IMP_LOG = IMP_LOGS_DIR + "imperative.log";

describe("imperative-test-cli test logging command", () => {

    describe("default levels", () => {
        /*******************************************************/
        // Tests for setting invalid values for imperative logger
        describe("imperative logger", () => {
            // Create the unique test environment
            beforeEach(async () => {
                TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
                    cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
                    testName: "imperative_test_cli_test_logging_command_default_imperative_logger"
                });
            });

            it("should default to WARN", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + IMP_LOG).toString();

                // Check for each tag
                expect(logContents).not.toContain("[TRACE]");
                expect(logContents).not.toContain("[DEBUG]");
                expect(logContents).not.toContain("[INFO]");
                expect(logContents).toContain("[WARN]");
                expect(logContents).toContain("[ERROR]");
                expect(logContents).toContain("[FATAL]");
            });
        });

        /*******************************************************/
        // Tests for setting invalid values for app logger
        describe("app logger", () => {
            // Create the unique test environment
            beforeEach(async () => {
                TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
                    cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
                    testName: "imperative_test_cli_test_logging_command_default_app_logger"
                });
            });

            it("should default to WARN", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + APP_LOG).toString();

                // Check for each tag
                expect(logContents).not.toContain("[TRACE]");
                expect(logContents).not.toContain("[DEBUG]");
                expect(logContents).not.toContain("[INFO]");
                expect(logContents).toContain("[WARN]");
                expect(logContents).toContain("[ERROR]");
                expect(logContents).toContain("[FATAL]");
            });
        });
    });

    /***************************************************/
    // Tests for setting invalid values
    describe("error & invalid value handling", () => {

        /*******************************************************/
        // Tests for setting invalid values for imperative logger
        describe("imperative logger", () => {
            // Create the unique test environment
            beforeEach(async () => {
                TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
                    cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
                    testName: "imperative_test_cli_test_logging_command_error_imperative_logger"
                });
            });

            it("should default to WARN if a blank is specified", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], { IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: " " });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + IMP_LOG).toString();

                // Check for each tag
                expect(logContents).not.toContain("[TRACE]");
                expect(logContents).not.toContain("[DEBUG]");
                expect(logContents).not.toContain("[INFO]");
                expect(logContents).toContain("[WARN]");
                expect(logContents).toContain("[ERROR]");
                expect(logContents).toContain("[FATAL]");
            });

            it("should default to WARN if an invalid level is specified and also warn user with the error", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], { IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: "AWESOME" });
                const errorMsg = response.stderr.toString();
                expect(errorMsg).toContain("AWESOME");
                expect(errorMsg).toContain("IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL");
                expect(errorMsg).toContain(LoggerConfigBuilder.getDefaultLogLevel());
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + IMP_LOG).toString();

                // Check for each tag
                expect(logContents).not.toContain("[TRACE]");
                expect(logContents).not.toContain("[DEBUG]");
                expect(logContents).not.toContain("[INFO]");
                expect(logContents).toContain("[WARN]");
                expect(logContents).toContain("[ERROR]");
                expect(logContents).toContain("[FATAL]");
            });
        });

        /*******************************************************/
        // Tests for setting invalid values for app logger
        describe("app logger", () => {
            // Create the unique test environment
            beforeEach(async () => {
                TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
                    cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
                    testName: "imperative_test_cli_test_logging_command_error_app_logger"
                });
            });

            it("should default to WARN if a blank is specified", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], { IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: " " });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + APP_LOG).toString();

                // Check for each tag
                expect(logContents).not.toContain("[TRACE]");
                expect(logContents).not.toContain("[DEBUG]");
                expect(logContents).not.toContain("[INFO]");
                expect(logContents).toContain("[WARN]");
                expect(logContents).toContain("[ERROR]");
                expect(logContents).toContain("[FATAL]");
            });

            it("should default to WARN if an invalid level is specified and also warn user with the error", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], { IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: "AWESOME" });
                const errorMsg = response.stderr.toString();
                expect(errorMsg).toContain("AWESOME");
                expect(errorMsg).toContain("IMPERATIVE_TEST_CLI_APP_LOG_LEVEL");
                expect(errorMsg).toContain(LoggerConfigBuilder.getDefaultLogLevel());
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + APP_LOG).toString();

                // Check for each tag
                expect(logContents).not.toContain("[TRACE]");
                expect(logContents).not.toContain("[DEBUG]");
                expect(logContents).not.toContain("[INFO]");
                expect(logContents).toContain("[WARN]");
                expect(logContents).toContain("[ERROR]");
                expect(logContents).toContain("[FATAL]");
            });
        });
    });

    /******************************************************/
    // Tests for setting the log levels of different loggers
    describe("logging", () => {
        /***************************************************/
        // Tests for setting the imperative log level ENV var
        describe("imperative logger", () => {

            // Create the unique test environment
            beforeEach(async () => {
                TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
                    cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
                    testName: "imperative_test_cli_test_logging_command_imperative_logger"
                });
            });

            it("should only produce NO log messages if the level is OFF", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], { IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: "OFF" });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logStats = fs.statSync(TEST_ENVIRONMENT.workingDir + IMP_LOG);
                expect(logStats.size).toBe(0);
            });

            it("should produce all message levels if TRACE is specified", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], { IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: "TRACE" });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + IMP_LOG).toString();

                // Check for each tag
                expect(logContents).toContain("[TRACE]");
                expect(logContents).toContain("[DEBUG]");
                expect(logContents).toContain("[INFO]");
                expect(logContents).toContain("[WARN]");
                expect(logContents).toContain("[ERROR]");
                expect(logContents).toContain("[FATAL]");

                // Check for each message text
                expect(logContents).toContain("This is an imperative logger trace message from the test logging handler!");
                expect(logContents).toContain("This is an imperative logger debug message from the test logging handler!");
                expect(logContents).toContain("This is an imperative logger info message from the test logging handler!");
                expect(logContents).toContain("This is an imperative logger warn message from the test logging handler!");
                expect(logContents).toContain("This is an imperative logger error message from the test logging handler!");
                expect(logContents).toContain("This is an imperative logger fatal message from the test logging handler!");
            });
        });

        /***************************************************/
        // Tests for setting the app log level ENV var
        describe("app logger", () => {
            // Create the unique test environment
            beforeEach(async () => {
                TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
                    cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
                    testName: "imperative_test_cli_test_logging_command_app_logger"
                });
            });

            it("should only produce NO log messages if the level is OFF", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], { IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: "OFF" });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logStats = fs.statSync(TEST_ENVIRONMENT.workingDir + APP_LOG);
                expect(logStats.size).toBe(0);
            });

            it("should produce all message levels if TRACE is specified", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], { IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: "TRACE" });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const logContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + APP_LOG).toString();

                // Check for each tag
                expect(logContents).toContain("[TRACE]");
                expect(logContents).toContain("[DEBUG]");
                expect(logContents).toContain("[INFO]");
                expect(logContents).toContain("[WARN]");
                expect(logContents).toContain("[ERROR]");
                expect(logContents).toContain("[FATAL]");

                // Check for each message text
                expect(logContents).toContain("This is an app logger trace message from the test logging handler!");
                expect(logContents).toContain("This is an app logger debug message from the test logging handler!");
                expect(logContents).toContain("This is an app logger info message from the test logging handler!");
                expect(logContents).toContain("This is an app logger warn message from the test logging handler!");
                expect(logContents).toContain("This is an app logger error message from the test logging handler!");
                expect(logContents).toContain("This is an app logger fatal message from the test logging handler!");
            });
        });

        describe("all loggers", () => {
            // Create the unique test environment
            beforeEach(async () => {
                TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
                    cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
                    testName: "imperative_test_cli_test_logging_command_all_loggers"
                });
            });

            it("should only produce NO log messages if the level is OFF", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], {
                        IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: "OFF",
                        IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: "OFF"
                    });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const appLogStats = fs.statSync(TEST_ENVIRONMENT.workingDir + APP_LOG);
                expect(appLogStats.size).toBe(0);

                const impLogStats = fs.statSync(TEST_ENVIRONMENT.workingDir + IMP_LOG);
                expect(impLogStats.size).toBe(0);
            });

            it("should produce all message levels if TRACE is specified", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], {
                        IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: "TRACE",
                        IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: "TRACE"
                    });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const appLogContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + APP_LOG).toString();

                // Check for each tag
                expect(appLogContents).toContain("[TRACE]");
                expect(appLogContents).toContain("[DEBUG]");
                expect(appLogContents).toContain("[INFO]");
                expect(appLogContents).toContain("[WARN]");
                expect(appLogContents).toContain("[ERROR]");
                expect(appLogContents).toContain("[FATAL]");

                // Check for each message text
                expect(appLogContents).toContain("This is an app logger trace message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger debug message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger info message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger warn message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger error message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger fatal message from the test logging handler!");

                const impLogContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + IMP_LOG).toString();

                // Check for each tag
                expect(impLogContents).toContain("[TRACE]");
                expect(impLogContents).toContain("[DEBUG]");
                expect(impLogContents).toContain("[INFO]");
                expect(impLogContents).toContain("[WARN]");
                expect(impLogContents).toContain("[ERROR]");
                expect(impLogContents).toContain("[FATAL]");

                // Check for each message text
                expect(impLogContents).toContain("This is an imperative logger trace message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger debug message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger info message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger warn message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger error message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger fatal message from the test logging handler!");
            });

            it("should produce the correct levels if app is INFO and imperative is ERROR", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], {
                        IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: "INFO",
                        IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: "ERROR"
                    });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const appLogContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + APP_LOG).toString();

                // Check for each tag
                expect(appLogContents).not.toContain("[TRACE]");
                expect(appLogContents).not.toContain("[DEBUG]");
                expect(appLogContents).toContain("[INFO]");
                expect(appLogContents).toContain("[WARN]");
                expect(appLogContents).toContain("[ERROR]");
                expect(appLogContents).toContain("[FATAL]");

                // Check for each message text
                expect(appLogContents).not.toContain("This is an app logger trace message from the test logging handler!");
                expect(appLogContents).not.toContain("This is an app logger debug message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger info message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger warn message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger error message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger fatal message from the test logging handler!");

                const impLogContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + IMP_LOG).toString();

                // Check for each tag
                expect(impLogContents).not.toContain("[TRACE]");
                expect(impLogContents).not.toContain("[DEBUG]");
                expect(impLogContents).not.toContain("[INFO]");
                expect(impLogContents).not.toContain("[WARN]");
                expect(impLogContents).toContain("[ERROR]");
                expect(impLogContents).toContain("[FATAL]");

                // Check for each message text
                expect(impLogContents).not.toContain("This is an imperative logger trace message from the test logging handler!");
                expect(impLogContents).not.toContain("This is an imperative logger debug message from the test logging handler!");
                expect(impLogContents).not.toContain("This is an imperative logger info message from the test logging handler!");
                expect(impLogContents).not.toContain("This is an imperative logger warn message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger error message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger fatal message from the test logging handler!");
            });

            it("should produce only INFO, WARN, ERROR, & FATAL if INFO is specified", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], {
                        IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: "INFO",
                        IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: "INFO"
                    });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                const appLogContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + APP_LOG).toString();

                // Check for each tag
                expect(appLogContents).not.toContain("[TRACE]");
                expect(appLogContents).not.toContain("[DEBUG]");
                expect(appLogContents).toContain("[INFO]");
                expect(appLogContents).toContain("[WARN]");
                expect(appLogContents).toContain("[ERROR]");
                expect(appLogContents).toContain("[FATAL]");

                // Check for each message text
                expect(appLogContents).not.toContain("This is an app logger trace message from the test logging handler!");
                expect(appLogContents).not.toContain("This is an app logger debug message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger info message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger warn message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger error message from the test logging handler!");
                expect(appLogContents).toContain("This is an app logger fatal message from the test logging handler!");

                // Read the imperative log contents
                const impLogContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + IMP_LOG).toString();

                // Check for each tag
                expect(impLogContents).not.toContain("[TRACE]");
                expect(impLogContents).not.toContain("[DEBUG]");
                expect(impLogContents).toContain("[INFO]");
                expect(impLogContents).toContain("[WARN]");
                expect(impLogContents).toContain("[ERROR]");
                expect(impLogContents).toContain("[FATAL]");

                // Check for each message text
                expect(impLogContents).not.toContain("This is an imperative logger trace message from the test logging handler!");
                expect(impLogContents).not.toContain("This is an imperative logger debug message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger info message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger warn message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger error message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger fatal message from the test logging handler!");
            });

            it("should produce all for IMP if TRACE and none for APP if OFF", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], {
                        IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: "OFF",
                        IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: "TRACE"
                    });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                // Ensure that the app log is empty
                const appLogStats = fs.statSync(TEST_ENVIRONMENT.workingDir + APP_LOG);
                expect(appLogStats.size).toBe(0);

                // Ensure that the imp log has all levels
                const impLogContents = fs.readFileSync(TEST_ENVIRONMENT.workingDir + IMP_LOG).toString();

                // Check for each tag
                expect(impLogContents).toContain("[TRACE]");
                expect(impLogContents).toContain("[DEBUG]");
                expect(impLogContents).toContain("[INFO]");
                expect(impLogContents).toContain("[WARN]");
                expect(impLogContents).toContain("[ERROR]");
                expect(impLogContents).toContain("[FATAL]");

                // Check for each message text
                expect(impLogContents).toContain("This is an imperative logger trace message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger debug message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger info message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger warn message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger error message from the test logging handler!");
                expect(impLogContents).toContain("This is an imperative logger fatal message from the test logging handler!");
            });

            it("should produce all for APP if TRACE and none for IMP if OFF", () => {
                // Log working directory to make it easier to identify the directory for this test
                TestLogger.info(`Working directory: ${TEST_ENVIRONMENT.workingDir}`);

                // Set the ENV var for the script
                const response = runCliScript(__dirname + "/__scripts__/test_logging_cmd.sh",
                    TEST_ENVIRONMENT.workingDir, [], {
                        IMPERATIVE_TEST_CLI_APP_LOG_LEVEL: "TRACE",
                        IMPERATIVE_TEST_CLI_IMPERATIVE_LOG_LEVEL: "OFF"
                    });
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();

                // Make sure the log files are present
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + APP_LOG)).toBe(true);
                expect(fs.existsSync(TEST_ENVIRONMENT.workingDir + IMP_LOG)).toBe(true);

                // Ensure that the app log is empty
                const impLogStats = fs.statSync(TEST_ENVIRONMENT.workingDir + IMP_LOG);
                expect(impLogStats.size).toBe(0);

                // Ensure that the imp log has all levels
                const appLogStats = fs.readFileSync(TEST_ENVIRONMENT.workingDir + APP_LOG).toString();

                // Check for each tag
                expect(appLogStats).toContain("[TRACE]");
                expect(appLogStats).toContain("[DEBUG]");
                expect(appLogStats).toContain("[INFO]");
                expect(appLogStats).toContain("[WARN]");
                expect(appLogStats).toContain("[ERROR]");
                expect(appLogStats).toContain("[FATAL]");

                // Check for each message text
                expect(appLogStats).toContain("This is an app logger trace message from the test logging handler!");
                expect(appLogStats).toContain("This is an app logger debug message from the test logging handler!");
                expect(appLogStats).toContain("This is an app logger info message from the test logging handler!");
                expect(appLogStats).toContain("This is an app logger warn message from the test logging handler!");
                expect(appLogStats).toContain("This is an app logger error message from the test logging handler!");
                expect(appLogStats).toContain("This is an app logger fatal message from the test logging handler!");
            });
        });
    });
});
