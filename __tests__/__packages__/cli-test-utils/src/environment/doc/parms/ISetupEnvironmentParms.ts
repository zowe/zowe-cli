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
     * The name of your test suite. Do not include spaces - used to create the working directory (to allow
     * for easier debug reference if a test fails).
     * @type {string}
     * @memberof ISetupEnvironmentParms
     */
    testName: string;

    /**
     * A list of types of profiles to create from your custom.properties file
     *
     * If this is specified, the tempProfiles field will appear on your
     * ITestEnvironment object when setup is complete. tempProfiles
     * can be used to delete the profiles later
     *
     * Example: ["zosmf", "tso"]
     * @type {string[]}
     * @memberof ISetupEnvironmentParms
     */
    tempProfileTypes?: string[];

    /**
     * Skip trying to load custom_properties.yaml
     * Useful for integration tests that don't need the properties
     * but want a working directory and other test environment features
     * Default: false
     */
    skipProperties?: boolean;

    /**
     * Is your project a CLI plugin which should be installed to your home
     * directory before the tests? There is no need to specify this unless
     * you are trying to execute plugin commands installed into Zowe CLI.
     */
    installPlugin?: boolean;

    /**
     * Should old-school profiles be created instead of team config?
     * Default: false
     */
    createOldProfiles?: boolean;
}
