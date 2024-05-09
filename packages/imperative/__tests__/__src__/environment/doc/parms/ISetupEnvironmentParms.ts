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

/**
 * Parameters used to setup your isolated test directory. Jest allows parallel test execution and many of the
 * CLI and API tests need a working directory & test scratch area. The test environment setup creates that
 * area and sets the cli home environment variable to the test area.
 * @export
 * @interface ISetupEnvironmentParms
 */
export interface ISetupEnvironmentParms {
    /**
     * The home environment variable for your CLI - sets it to the working directory create for your test.
     * @type {string}
     * @memberof ISetupEnvironmentParms
     */
    cliHomeEnvVar: string;
    /**
     * The name of your test suite. Do not include spaces - used to create the working directory (to allow
     * for easier debug reference if a test fails).
     * @type {string}
     * @memberof ISetupEnvironmentParms
     */
    testName: string;
}
