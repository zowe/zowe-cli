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

export let TEST_USING_WORKSPACE = false;

function projectRootDir() {
    let finalProjectRootDir = null;
    let lernaTestDirExists = false;
    // First look for lerna.json to handle monorepos with tests at top level
    const lernaJsonPath = findUp.sync("lerna.json");
    if (lernaJsonPath != null) {
        const lernaRootDir = nodePath.dirname(lernaJsonPath);
        if (fs.existsSync(nodePath.join(lernaRootDir, "__tests__"))) {
            finalProjectRootDir = lernaRootDir;
            lernaTestDirExists = true;
        }
    }
    // Next look for package.json in single-package repo
    const packageJsonPath = findUp.sync("package.json");
    if (packageJsonPath != null && finalProjectRootDir == null) {
        finalProjectRootDir = nodePath.dirname(packageJsonPath);
    }

    if (finalProjectRootDir == null) {
        finalProjectRootDir = process.cwd();
    }

    // Look for the workspace that is running the current test
    const getTestRootDir = (defaultRootDir: string) => {
        let stackTrace: string;
        try {
            throw new Error('Debugging error');
        } catch (e: any) {
            stackTrace = e.stack;
        }
        const filePaths = [];
        for (const line of stackTrace.split('\n')) {
            const match = line.match(/\((.*?):\d+:\d+\)$/);
            if (match) {
                filePaths.push(match[1]);
            }
        }
        const filtered = filePaths.filter((stackFilePath: string) => {
            const filePath = stackFilePath.replace(/\\/g, "/");
            return !filePath.includes("node_modules/jest-") && !filePath.includes("cli-test-utils");
        });
        return filtered[0]?.split("/__tests__")[0] ?? defaultRootDir;
    };

    const testRootDir = getTestRootDir(finalProjectRootDir);

    if (process.env.CLI_TEST_UTILS_USE_PROJECT_ROOT_DIR && lernaTestDirExists) { return finalProjectRootDir; }
    // lernaTestDirExists == true XOR (finalProjectRootDir == testRootDir)
    TEST_USING_WORKSPACE = lernaTestDirExists ? finalProjectRootDir != testRootDir : finalProjectRootDir == testRootDir;
    return TEST_USING_WORKSPACE ? testRootDir : finalProjectRootDir;
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
