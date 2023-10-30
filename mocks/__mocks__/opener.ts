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

const opener_ = jest.fn(() => ({
    unref: jest.fn(),
    stderr: {unref: jest.fn()},
    stdin: {unref: jest.fn()},
    stdout: {unref: jest.fn()},
}));

module.exports = opener_;
