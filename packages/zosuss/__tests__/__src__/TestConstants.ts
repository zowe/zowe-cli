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

import { resolve } from "path";

// The test results directory name - all tests results - logs, test home dirs,
// coverage reports, etc. are placed in the results directory.
export const TEST_RESULT_DIR = resolve(__dirname + "/../__results__/");

// The test data directory is where all data that a test (API/CLI) generates
// will be placed. Data such as logs, downloaded files, imperative homes, etc.
export const TEST_RESULT_DATA_DIR = resolve(TEST_RESULT_DIR + "/data/");
