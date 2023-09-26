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
import { ImperativeExpect } from "../../../packages";
import * as nodePath from "path";
import { TEST_RESULT_DATA_DIR } from "../TestConstants";
import { mkdirpSync } from "fs-extra";
import { ITestEnvironment } from "./doc/response/ITestEnvironment";
const uuidv4 = require("uuid/v4");
/**
 * Use the utility methods here to setup the test environment for running APIs
 * and CLIs. Imperative will always touch the filesystem in some capacity
 * and these utilties help contanerize the tests.
 * @export
 * @class SetupTestEnvironment
 */
export class SetupTestEnvironment {
    public static readonly ERROR_TAG: string = "Setup Test Environment Error:";

    /**
     * Integration tests (tests that will perform an Imperative init, use the filesystem, etc) should invoke this method
     * as part of the Jest describes "beforeAll()" method. This method creates a unique test environment to enable
     * parallel execution of tests and to provide an isolated working directory for any filesystem manipulation that
     * needs to occur.
     * @static
     * @param {ISetupEnvironmentParms} params - See the interface for parameter details.
     * @returns {Promise<ITestEnvironment>}
     * @memberof SetupTestEnvironment
     */
    public static async createTestEnv(params: ISetupEnvironmentParms): Promise<ITestEnvironment> {
        // Validate the input parameters
        ImperativeExpect.toNotBeNullOrUndefined(params,
            `${SetupTestEnvironment.ERROR_TAG} createTestEnv(): No parameters supplied.`);
        ImperativeExpect.keysToBeDefinedAndNonBlank(params, ["cliHomeEnvVar"],
            `${SetupTestEnvironment.ERROR_TAG} createTestEnv(): You must supply the home environment variable name.`);
        ImperativeExpect.keysToBeDefinedAndNonBlank(params, ["testName"],
            `${SetupTestEnvironment.ERROR_TAG} createTestEnv(): You must supply the name of the test. ` +
            `Used to append to the data directory for ease of identification.`);

        // Get a unique test data area
        const testDirectory: string = SetupTestEnvironment.createUniqueTestDataDir(params.testName);

        // Set the home environment variable
        process.env[params.cliHomeEnvVar] = testDirectory;

        // Return the working directory that the tests should be using
        return {
            workingDir: testDirectory
        };
    }

    /**
     * Creates a unique test data directory for a test to work with in isolation.
     * @static
     * @param {string} testName - Adds the test name to the directory name for ease of identification.
     * @returns {string} - The unique directory (within the __results__/data/ area).
     * @memberof SetupTestEnvironment
     */
    public static createUniqueTestDataDir(testName: string): string {
        const app = uuidv4() + "_" + testName + "/";
        const path = nodePath.resolve(TEST_RESULT_DATA_DIR + "/" + app);
        mkdirpSync(path);
        return path;
    }
}
