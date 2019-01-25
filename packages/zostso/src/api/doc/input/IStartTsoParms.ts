/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

/**
 * Interface for TSO start command z/OSMF parameters
 * @export
 * @interface IStartTsoParms
 */
export interface IStartTsoParms {
    /**
     * name of the logonProcedure for address space
     * @type string
     * @memberOf IStartTsoParms
     */
    logonProcedure?: string;

    /**
     * character set for address space
     * @type string
     * @memberOf IStartTsoParms
     */
    characterSet?: string;

    /**
     * code page for tso address space
     * @type string
     * @memberOf IStartTsoParms
     */
    codePage?: string;

    /**
     * number of rows
     * @type string
     * @memberOf IStartTsoParms
     */
    rows?: string;

    /**
     * number of columns
     * @type string
     * @memberOf IStartTsoParms
     */
    columns?: string;

    /**
     * user account number
     * @type string
     * @memberOf IStartTsoParms
     */
    account?: string;

    /**
     * region size for address space
     * @type string
     * @memberOf IStartTsoParms
     */
    regionSize?: string;
}
