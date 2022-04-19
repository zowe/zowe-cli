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

import { IStartTsoParms } from "./IStartTsoParms";

/**
 * Interface for TSO issue command z/OSMF parameters
 * @export
 * @interface IIssueTsoParms
 */
export interface IIssueTsoParms {

    /**
     * Command text to issue to the TSO address space.
     * @type {string}
     * @memberof IIssueTsoParms
     */
    command: string;
    /**
     * Accounting info for Jobs
     * @type {string}
     * @memberof IIssueTsoParms
     */
    accountNumber: string;
    /**
     * Interface for TSO start command z/OSMF parameters
     * @type {string}
     * @memberof IIssueTsoParms
     */
    startParams: IStartTsoParms;
}
