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

const os = jest.genMockFromModule("os") as any;

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
let mockOs = Object.create(null);
function __setMockOs(newMockOs: { [key: string]: string }) {
    mockOs = newMockOs;
}

// A custom version of `lstatSync` that reads from the special mocked out
// file list set via __setMockFiles
function homedir() {
    return mockOs.homedir;
}

os.__setMockOs = __setMockOs;
os.homedir = homedir;

module.exports = os;
