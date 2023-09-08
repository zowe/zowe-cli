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

import { homedir } from "os";
import { join } from "path";


const PROJECTS_HOME = join(__dirname, "../../");

/**
 * Variables related to the various projects used during development.
 * @type {object}
 */
export const PROJECTS = {
    /**
   * This is a reference to the parent project folder. This is the folder that should
   * contain the imperative, imperative-sample, and imperative-plugins source
   * folders.
   * @type {string}
   */
    HOME: PROJECTS_HOME,

    /**
   * The resolved directory of the imperative source
   * @type {string}
   */
    IMPERATIVE_CLI: join(PROJECTS_HOME, "imperative"),

    /**
   * The resolved directory of the imperative-sample source
   * @type {string}
   */
    IMPERATIVE_SAMPLE: join(PROJECTS_HOME, "imperative-sample"),

    /**
   * The resolved directory of the imperative-plugins source
   *
   * @type {string}
   */
    IMPERATIVE_PLUGINS: join(PROJECTS_HOME, "imperative-plugins")
};

const SAMPLE_CLI_HOME = join(homedir(), ".sample-cli");
const SAMPLE_CLI_PLUGIN_HOME = join(SAMPLE_CLI_HOME, "plugins");
const SAMPLE_CLI_PLUGIN_JSON = join(SAMPLE_CLI_PLUGIN_HOME, "plugins.json");
const SAMPLE_CLI_PLUGIN_INSTALL = join(SAMPLE_CLI_PLUGIN_HOME, "installed");

/**
 * Variables relating to the home directory of the Sample CLI application
 * @type {object}
 */
export const SAMPLE_CLI = {
    /**
   * The home folder for the Sample CLI
   *
   * @type {string}
   */
    HOME: SAMPLE_CLI_HOME,

    /**
   * Locations used by the PMF
   * @type {object}
   */
    PLUGINS: {
    /**
     * The plugins folder used by the PMF
     *
     * @type {string}
     */
        HOME: SAMPLE_CLI_PLUGIN_HOME,

        /**
     * The install directory of plugins
     *
     * @type {string}
     */
        INSTALL_LOCATION: SAMPLE_CLI_PLUGIN_INSTALL,

        /**
     * The plugins.json file config location
     *
     * @type {string}
     */
        JSON: SAMPLE_CLI_PLUGIN_JSON
    }
};

/**
 * The location of the test registry for use in the integration tests. This is a registry that we
 * have built for the purposes of doing registry specific testing.
 *
 * @type {string}
 * @default http://imperative-npm-registry:4873
 */
export const TEST_REGISTRY = "http://imperative-npm-registry:4873";

// The test results directory name - all tests results - logs, test home dirs,
// coverage reports, etc. are placed in the results directory.
export const TEST_RESULT_DIR = join(__dirname, "/../__results__/");

// The test data directory is where all data that a test (API/CLI) generates
// will be placed. Data such as logs, downloaded files, imperative homes, etc.
export const TEST_RESULT_DATA_DIR = join(TEST_RESULT_DIR, "/data/");
