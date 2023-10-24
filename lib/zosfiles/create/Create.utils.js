"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateZosmfOptions = void 0;
/**
 * Generate the appropriate options object to create a dataset before sending it to the z/OS MF APIs
 * @param {yargs.Arguments} commandArguments - The provided command arguments
 * @return {ICreateDataSetOptions} Object to be sent
 */
function generateZosmfOptions(commandArguments) {
    return JSON.parse(JSON.stringify({
        alcunit: commandArguments.allocationSpaceUnit,
        volser: commandArguments.volumeSerial,
        primary: commandArguments.primarySpace,
        secondary: commandArguments.secondarySpace,
        dirblk: commandArguments.directoryBlocks,
        recfm: commandArguments.recordFormat,
        blksize: commandArguments.blockSize,
        lrecl: commandArguments.recordLength,
        storclass: commandArguments.storageClass,
        mgntclass: commandArguments.managementClass,
        dataclass: commandArguments.dataClass,
        dsntype: commandArguments.dataSetType,
        showAttributes: commandArguments.showAttributes || commandArguments.attributes,
        size: commandArguments.size,
        responseTimeout: commandArguments.responseTimeout
    }));
}
exports.generateZosmfOptions = generateZosmfOptions;
//# sourceMappingURL=Create.utils.js.map