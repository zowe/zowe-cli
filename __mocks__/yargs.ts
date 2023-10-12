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

import {relative} from "path";

// Since yargs uses path.relative and somehow mocking fails because of this,
// we need to check if relative is a mocked function. If it is, reinstall the
// actual instance of the standard library so we can mock yargs.
const isMock = jest.isMockFunction(relative);

if (isMock) {
    jest.dontMock("path");
}

const yargs = jest.genMockFromModule("yargs");

// Once we are done, we should install the mock back so that the test that needed
// to mock yargs continues as expected.
if (isMock) {
    jest.doMock("path");
}

module.exports = yargs;
