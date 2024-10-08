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
import * as nodePath from "path";

import * as yaml from "js-yaml";
import { v4 as uuidv4 } from "uuid";
import { ImperativeError, ImperativeExpect, IO, Logger, LoggingConfigurer, TextUtils } from "@zowe/imperative";

import { ISetupEnvironmentParms } from "./doc/parms/ISetupEnvironmentParms";
import { ITestEnvironment } from "./doc/response/ITestEnvironment";
import { TempTestProfiles } from "./TempTestProfiles";
import { PROJECT_ROOT_DIR, TEST_RESOURCE_DIR, TEST_RESULT_DATA_DIR, TEST_USING_WORKSPACE } from "../TestConstants";
import { runCliScript } from "../TestUtils";

/**
 * Use the utility methods here to setup the test environment for running APIs
 * and CLIs. Imperative will always touch the filesystem in some capacity
 * and these utilties help containerize the tests.
 * @export
 * @class TestEnvironment
 */
export class TestEnvironment {
    public static readonly ERROR_TAG: string = "Setup Test Environment Error:";
    public static readonly HOME_ENV_KEY = "ZOWE_CLI_HOME";

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
    public static async setUp(params: ISetupEnvironmentParms): Promise<ITestEnvironment<any>> {
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
        env[this.HOME_ENV_KEY] = testDirectory;

        const result: ITestEnvironment<any> = {
            workingDir: testDirectory,
            systemTestProperties: systemProps,
            env
        };

        if (params.installPlugin) {
            await this.installPlugin(result);
            result.pluginInstalled = true;
        }

        // the result of the test environment setup so far is used to create profiles
        if (params.tempProfileTypes?.length ?? 0 > 0) {
            result.tempProfiles = await TempTestProfiles.createProfiles(result, params.tempProfileTypes);
        }

        Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));

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
    public static async cleanUp(testEnvironment: ITestEnvironment<any>) {
        if (testEnvironment.tempProfiles != null) {
            await TempTestProfiles.deleteProfiles(testEnvironment);
        }
        if (testEnvironment.pluginInstalled) {
            const pluginDir = testEnvironment.workingDir + "/plugins";
            require("rimraf").sync(pluginDir);
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
        IO.mkdirp(path);
        return path;
    }

    protected static readonly DEFAULT_PROPERTIES = "custom_properties.yaml";
    protected static readonly DEFAULT_PROPERTIES_LOCATION = nodePath.resolve(TEST_RESOURCE_DIR + "/properties") + "/";

    /**
     * Load the properties file specified with system test configuration information.
     * @static
     * @param {string} filePath - Specify the filePath of the properties file. Leave empty to use the properties
     *  file specified in the process.env.
     * @param {string} testDirectory - the working directory to log  informational messages to
     * @returns {ITestPropertiesSchema} - The parsed test properties.
     * @memberof TestEnvironment
     */
    protected static loadSystemTestProperties<T>(filePath: string | null = null, testDirectory: string): T {
        const logger: Logger = this.getMockFileLogger(testDirectory);
        // For now, I'm leaving the option for env specified properties in code. This will not be documented.
        const propfilename: string = process.env.propfile || TestEnvironment.DEFAULT_PROPERTIES;
        const propfiledir: string = process.env.propdirectory || TestEnvironment.DEFAULT_PROPERTIES_LOCATION;
        const propfile: string = propfiledir + propfilename;
        /**
         * Extract the properties file location based on env var or default locations
         */
        let properties: T;

        /**
         * Parse the yaml file
         */
        try {
            logger.info("Reading yaml configuration file: " + propfile + "...");
            properties = yaml.load(fs.readFileSync(propfile, "utf8")) as any;
            logger.info("Properties file read.");
            // injectCliProps(properties);
            // console.log(properties);
        } catch (error) {
            logger.error("Error reading test properties yaml configuration file. Tests cannot continue. " +
                "Additional details:" + error);
            throw error;
        }
        logger.info("Loaded configuration properties file.");

        return properties;
    }

    /**
     * Installs the plug-in into the working directory created for the test environment,
     * so that commands exposed through this plug-in can be issued in tests.
     * @param {ITestEnvironment} testEnvironment the test environment so far
     * @returns {Promise<void>} - promise that resolves on completion of the install
     */
    protected static async installPlugin(testEnvironment: ITestEnvironment<any>) {
        const pluginRelPath = nodePath.relative(testEnvironment.workingDir, PROJECT_ROOT_DIR).replace(/\\/g, "/");
        const packageJson = require(nodePath.join(PROJECT_ROOT_DIR, "package.json"));
        const pluginConfig = require(nodePath.join(PROJECT_ROOT_DIR, packageJson.imperative.configurationModule));

        let installScript: string = TempTestProfiles.SHEBANG;
        // install plugin from root of project
        // Note: the TEST_USING_WORKSPACE is just a hack to work around this bug: https://github.com/npm/cli/issues/6099
        installScript += `zowe plugins install ${pluginRelPath}${TEST_USING_WORKSPACE ? " --registry=https://registry.npmjs.org/": ""}\n`;

        installScript += `zowe plugins validate ${packageJson.name}\n`;
        if (pluginConfig.definitions != null && pluginConfig.definitions.length > 0) {
            installScript += `zowe ${pluginConfig.name} --help\n`; // check that the plugin help is available
        }
        const scriptPath = testEnvironment.workingDir + "/install_plugin.sh";
        IO.writeFile(scriptPath, Buffer.from(installScript));
        fs.chmodSync(scriptPath, "755");

        const output = runCliScript(scriptPath, testEnvironment, []);
        if (output.status !== 0) {
            throw new ImperativeError({
                msg: `Install of '${pluginConfig.name}' plugin failed! You should delete the script: \n` +
                    `'${scriptPath}' after reviewing it to check for possible errors.\n Output of the plugin ` +
                    `install command:\n` + output.stderr.toString() + output.stdout.toString() +
                    TempTestProfiles.GLOBAL_INSTALL_NOTE
            });
        }
        IO.deleteFile(scriptPath);
    }

    /**
     * Get a mocked version of the logger interface for logging test environment debug info
     * @param {string} workingDir - the working directory to log to
     * @returns {Logger} - a logger that can be used for test environment clean up and set up
     */
    protected static getMockFileLogger(workingDir: string): Logger {
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
