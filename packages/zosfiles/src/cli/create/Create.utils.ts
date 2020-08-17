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

// We are using arguments as an expected input to the function. Thus there is no generated code
// so we can ignore this linting error.
// tslint:disable-next-line:no-implicit-dependencies
import { Arguments } from "yargs";
import { ICreateDataSetOptions } from "../../api/methods/create/doc/ICreateDataSetOptions";

/**
 * Generate the appropriate options object to create a dataset before sending it to the z/OS MF APIs
 * @param {yargs.Arguments} commandArguments - The provided command arguments
 * @return {ICreateDataSetOptions} Object to be sent
 */
export function generateZosmfOptions(commandArguments: Arguments): ICreateDataSetOptions {
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
        showAttributes: commandArguments.showAttributes,
        size: commandArguments.size,
        responseTimeout: commandArguments.responseTimeout
    }));
}
