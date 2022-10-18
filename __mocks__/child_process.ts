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

const useRealFunction: string = "useRealFunction";
let execSyncOutput: string = useRealFunction;
const spawnSyncOutput = {
    "stdout": useRealFunction
};

// tests can set their own output value for execSync
function setExecSyncOutput(outputVal: string) {
    execSyncOutput = outputVal;
}

// tests can set their own output value for spawnSync
function setSpawnSyncOutput(outputVal: string) {
    spawnSyncOutput.stdout = outputVal;
}
// Mock function to use for child_process.execSync
function execSyncMock(cmd: string, options: Object) {
    if (execSyncOutput === useRealFunction) {
        // run the real execSync
        const execSyncReal = jest.requireActual("child_process").execSync;
        return execSyncReal(cmd, options);
    } else {
        // return the output that the test set with setExecSyncOutput().
        return execSyncOutput;
    }
}

// Mock function to use for child_process.spawnSync
function spawnSyncMock(cmd: string, args: [string], options: Object) {
    if (spawnSyncOutput.stdout === useRealFunction) {
        // run the real spawnSync
        const spawnSyncReal = jest.requireActual("child_process").spawnSync;
        return spawnSyncReal(cmd, args, options);
    } else {
        // return the output that the test set with setSpawnSyncOutput().
        return spawnSyncOutput;
    }
}

child_process.setExecSyncOutput = setExecSyncOutput;
child_process.execSync = execSyncMock;

child_process.setSpawnSyncOutput = setSpawnSyncOutput;
child_process.spawnSync = spawnSyncMock;

module.exports = child_process;