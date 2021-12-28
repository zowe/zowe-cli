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

'use strict';

const child_process: any = jest.genMockFromModule("child_process");

let execSyncOutout: string = "ExecSyncNeverSet";

// tests can set their our output valu for execSync
function setExecSyncOutput(outputVal: string) {
    execSyncOutout = outputVal;
}

// Mock function to use for child_process.execSync
function execSyncMock(cmd: string, options: Object) {
    if (execSyncOutout === "ExecSyncNeverSet") {
        // run the real execSync
        const execSyncReal = require.requireActual("child_process").execSync;
        return execSyncReal(cmd, options);
    } else {
        // return the output that the test set with setExecSyncOutput().
        return execSyncOutout;
    }
}

child_process.setExecSyncOutput = setExecSyncOutput;
child_process.execSync = execSyncMock;
module.exports = child_process;