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
import * as findUp from "find-up";

function projectRootDir() {
    // First look for lerna.json to handle monorepos with tests at top level
    const lernaJson = findUp.sync("lerna.json");
    if (lernaJson != null) {
        const lernaRootDir = nodePath.dirname(lernaJson);
        if (fs.existsSync(nodePath.join(lernaRootDir, "__tests__"))) {
            return lernaRootDir;
        }
    }
    // Next look for package.json in single-package repo
    const packageJson = findUp.sync("package.json");
    if (packageJson != null) {
        return nodePath.dirname(packageJson);
    }
    // Finally fallback to using working directory
    return process.cwd();
}

// The root directory of the project - where package.json lives.
export const PROJECT_ROOT_DIR = projectRootDir() + "/";

// The test resources directory name - properties files are placed here.
export const TEST_RESOURCE_DIR = nodePath.join(PROJECT_ROOT_DIR, "__tests__", "__resources__") + "/";

// The test results directory name - all tests results - logs, test home dirs,
// coverage reports, etc. are placed in the results directory.
export const TEST_RESULT_DIR = nodePath.join(PROJECT_ROOT_DIR, "__tests__", "__results__") + "/";

// The test data directory is where all data that a test (API/CLI) generates
// will be placed. Data such as logs, downloaded files, imperative homes, etc.
export const TEST_RESULT_DATA_DIR = nodePath.join(TEST_RESULT_DIR, "data") + "/";
