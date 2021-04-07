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

import * as nodePath from "path";

// The root directory of the project - where package.json lives.
// It should always be 4 levels up from `__dirname`:
//   zowe-cli/__tests__/__packages__/cli-test-utils/src
//   zowe-cli-sample-plugin/node_modules/@zowe/cli-test-utils/src
export const PROJECT_ROOT_DIR = nodePath.join(__dirname, "..", "..", "..", "..") + "/";

// The test resources directory name - properties files are placed here.
export const TEST_RESOURCE_DIR = nodePath.join(PROJECT_ROOT_DIR, "__tests__", "__resources__") + "/";

// The test results directory name - all tests results - logs, test home dirs,
// coverage reports, etc. are placed in the results directory.
export const TEST_RESULT_DIR = nodePath.join(PROJECT_ROOT_DIR, "__tests__", "__results__") + "/";

// The test data directory is where all data that a test (API/CLI) generates
// will be placed. Data such as logs, downloaded files, imperative homes, etc.
export const TEST_RESULT_DATA_DIR = nodePath.join(TEST_RESULT_DIR, "data") + "/";
