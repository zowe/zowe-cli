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
import { IDataSet } from "@zowe/zos-files-for-zowe-sdk";

/**
 * Converts the name of a data set to an IDataSet
 * @param {string} name  - the name in the form USER.DATA.SET | USER.DATA.SET(mem1)
 */
export function getDataSet(name: string): IDataSet {
    const match = name.match(/(.*)\((.*)\)/);
    if (match) {
        const [, dsn, member] = match;
        return {
            dsn,
            member
        };
    } else {
        return {
            dsn: name
        };
    }
}
