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

jest.setTimeout(60000);

// Set this to be true always in case someone runs npx jest
process.env.CLI_TEST_UTILS_USE_PROJECT_ROOT_DIR = true;

beforeAll(() => {
    // If the worker runs out of memory, this needs to be reset
    require('events').EventEmitter.defaultMaxListeners = Infinity;
});