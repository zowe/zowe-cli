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

import { ISetupEnvironmentParms } from "./doc/parms/ISetupEnvironmentParms";
import { AbstractSession, ImperativeError, ImperativeExpect, Logger, Session, TextUtils } from "@zowe/imperative";
import * as nodePath from "path";
import { TEST_RESULT_DATA_DIR } from "../TestConstants";
import { mkdirpSync } from "fs-extra";
import { ITestEnvironment } from "./doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../properties/ITestPropertiesSchema";
import * as fs from "fs";
import { Constants } from "../../../packages/Constants";
import { TempTestProfiles } from "../profiles/TempTestProfiles";
import { SshSession } from "../../../packages/zosuss";

const uuidv4 = require("uuid");
const yaml = require("js-yaml");

/**
 * Use the utility methods here to setup the test environment for running APIs
 * and CLIs. Imperative will always touch the filesystem in some capacity
 * and these utilties help contanerize the tests.
 * @export
 * @class TestEnvironment
 */
export class TestEnvironment {
    public static readonly ERROR_TAG: string = "Setup Test Environment Error:";

    /**
     * Integration tests (tests that will perform an Imperative init, use the filesystem, etc) should invoke this method
     * as part of the Jest describes "beforeAll()" method. This method creates a unique test environment to enable
     * parallel execution of tests and to provide an isolated working directory for any filesystem manipulation that
     * needs to occur.
     * @static
     * @param {ISetupEnvironmentParms} params - See the interface for parameter details.
     * @returns {Promise<ITestEnvironment>}
     * @memberof TestEnvironment
     */
    public static async setUp(params: ISetupEnvironmentParms): Promise<ITestEnvironment> {
        // Validate the input parameters
        ImperativeExpect.toNotBeNullOrUndefined(params,
            `${TestEnvironment.ERROR_TAG} createTestEnv(): No parameters supplied.`);
        ImperativeExpect.keysToBeDefinedAndNonBlank(params, ["testName"],
            `${TestEnvironment.ERROR_TAG} createTestEnv(): You must supply the name of the test. ` +
            `Used to append to the data directory for ease of identification.`);

        // Get a unique test data area
        const testDirectory: string = TestEnvironment.createUniqueTestDataDir(params.testName);

        let systemProps;
        if (!params.skipProperties) {
            systemProps = TestEnvironment.loadSystemTestProperties(undefined, testDirectory);
        }
        // set the env variables to be used for executing
        // scripts in the test environment
        const env: { [key: string]: string } = {};
        env[Constants.HOME_ENV_KEY] = testDirectory;

        // Ensure correct path separator for windows or linux like systems.
        const separator = process.platform === "win32" ? ";" : ":";

        env.PATH = `${nodePath.resolve(__dirname, "../../__resources__/application_instances")}${separator}${process.env.PATH}`;

        const result: ITestEnvironment = {
            workingDir: testDirectory,
            systemTestProperties: systemProps,
            env
        };

        // the result of the test environment setup so far is used to create profiles
        result.tempProfiles = await TempTestProfiles.createProfiles(result, params.tempProfileTypes);

        // Return the test environment including working directory that the tests should be using
        return result;
    }

    /**
     * Clean up your test environment.
     * Deletes any temporary profiles that have been created
     * @params {ITestEnvironment} testEnvironment - the test environment returned by createTestEnv
     *
     * @returns {Promise<void>} - promise fulfilled when cleanup is complete
     * @throws errors if profiles fail to delete
     * @memberof TestEnvironment
     */
    public static async cleanUp(testEnvironment: ITestEnvironment) {
        if (testEnvironment.tempProfiles != null) {
            await TempTestProfiles.deleteProfiles(testEnvironment);
        }
    }

    /**
     * Creates a unique test data directory for a test to work with in isolation.
     * @static
     * @param {string} testName - Adds the test name to the directory name for ease of identification.
     * @returns {string} - The unique directory (within the results/data/ area).
     * @memberof TestEnvironment
     */
    public static createUniqueTestDataDir(testName: string): string {
        const app = uuidv4() + "_" + testName + "/";
        const path = nodePath.resolve(TEST_RESULT_DATA_DIR + "/" + app);
        mkdirpSync(path);
        return path;
    }

    /**
     * Create a ZOSMF session from properties present in your test environment
     * @param testEnvironment - your test environment with system test properties populated
     */
    public static createZosmfSession(testEnvironment: ITestEnvironment): AbstractSession {
        const SYSTEM_PROPS = testEnvironment.systemTestProperties;
        return new Session({
            user: SYSTEM_PROPS.zosmf.user,
            password: SYSTEM_PROPS.zosmf.pass,
            hostname: SYSTEM_PROPS.zosmf.host,
            port: SYSTEM_PROPS.zosmf.port,
            type: "basic",
            rejectUnauthorized: SYSTEM_PROPS.zosmf.rejectUnauthorized,
            basePath: SYSTEM_PROPS.zosmf.basePath
        });
    }

    /**
     * Create a ZOSMF session through the APIML from properties present in your test environment
     * @param testEnvironment - your test environment with system test properties populated
     */
    public static createBaseSession(testEnvironment: ITestEnvironment): AbstractSession {
        const SYSTEM_PROPS = testEnvironment.systemTestProperties;
        return new Session({
            user: SYSTEM_PROPS.base.user,
            password: SYSTEM_PROPS.base.pass,
            hostname: SYSTEM_PROPS.base.host,
            port: SYSTEM_PROPS.base.port,
            type: "token",
            tokenType: "apimlAuthenticationToken",
            rejectUnauthorized: SYSTEM_PROPS.base.rejectUnauthorized,
            basePath: SYSTEM_PROPS.base.basePath
        });
    }

    /**
     * Create a SSH session from properties present in your test environment
     * @param testEnvironment - your test environment with system test properties populated
     */
    public static createSshSession(testEnvironment: ITestEnvironment): SshSession {
        const defaultSystem = testEnvironment.systemTestProperties;
        return new SshSession({
            user: defaultSystem.ssh.user,
            password: defaultSystem.ssh.password,
            hostname: defaultSystem.ssh.host,
            port: defaultSystem.ssh.port,
            privateKey: defaultSystem.ssh.privateKey,
            keyPassphrase: defaultSystem.ssh.keyPassphrase,
            handshakeTimeout: defaultSystem.ssh.handshakeTimeout
        });
    }

    private static readonly DEFAULT_PROPERTIES = "custom_properties.yaml";
    private static readonly DEFAULT_PROPERTIES_LOCATION = nodePath.resolve(__dirname + "/../../__resources__/properties/") + "/";

    /**
     *  Load the properties file specified with system test configuration information.
     *  @static
     *  @param {string} filePath - Specify the filePath of the properties file. Leave empty to use the properties
     *   file specified in the process.env (see gulp tasks for more information).
     *   @param {string} testDirectory - the working directory to log  informational messages to
     *  @returns {ITestPropertiesSchema} - The parsed test properties.
     *  @memberof TestEnvironment
     */
    private static loadSystemTestProperties(filePath: string = null, testDirectory: string): ITestPropertiesSchema {
        const logger: Logger = this.getMockFileLogger(testDirectory);
        // For now, I'm leaving the option for env specified properties in code. This will not be documented.
        const propfilename: string = process.env.propfile || TestEnvironment.DEFAULT_PROPERTIES;
        const propfiledir: string = process.env.propdirectory || TestEnvironment.DEFAULT_PROPERTIES_LOCATION;
        const propfile: string = propfiledir + propfilename;
        /**
         * Extract the properties file location based on env var or default locations
         */
        let properties: ITestPropertiesSchema;

        /**
         * Parse the yaml file
         */
        try {
            logger.info("Reading yaml configuration file: " + propfile + "...");
            properties = yaml.safeLoad(fs.readFileSync(propfile, "utf8"));
            logger.info("Properties file read.");
            // injectCliProps(properties);
            // console.log(properties);
        } catch (error) {
            logger.error("Error reading test properties yaml configuration file. Tests cannot continue. " +
                "Additional details:" + error);
            throw new Error(error);
        }
        logger.info("Loaded configuration properties file.");

        return properties;
    }

    /**
     * Get a mocked version of the logger interface for logging test environment debug info
     * @param {string} workingDir - the working directory to log to
     * @returns {Logger} - a logger that can be used for test environment clean up and set up
     */
    private static getMockFileLogger(workingDir: string): Logger {
        const logFile = workingDir += "/TestEnvironment.log";
        const logFn = (tag: string, message: string, ...args: any[]) => {
            message = TextUtils.formatMessage(message, ...args);
            fs.appendFileSync(logFile, tag + " " + message + "\n");
        };
        return {
            mJsLogger: undefined,
            getCallerFileAndLineTag: undefined,
            level: undefined,
            logService: undefined,
            simple: (message: string, ...args: any[]) => {
                logFn("[SIMPLE]", message, ...args);
            },
            trace: (message: string, ...args: any[]) => {
                logFn("[TRACE]", message, ...args);
            },
            debug: (message: string, ...args: any[]) => {
                logFn("[DEBUG]", message, ...args);
            },
            info: (message: string, ...args: any[]) => {
                logFn("[INFO]", message, ...args);
            },
            warn: (message: string, ...args: any[]) => {
                logFn("[WARN]", message, ...args);
            },
            error: (message: string, ...args: any[]) => {
                logFn("[ERROR]", message, ...args);
            },
            fatal: (message: string, ...args: any[]) => {
                logFn("[FATAL]", message, ...args);
            },
            logError: (error: ImperativeError) => {
                logFn("[ERROR]", "Error:\n" + require("util").inspect(error));
            }
        } as any;

    }

}
