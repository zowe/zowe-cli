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
 * Interface for command options passed in from command handler
 * @export
 * @interface IIssueTsoCmdOpts
 */
export interface IIssueTsoCmdOpts {
    /**
     * address space options for TSO Command
     * @type {string}
     * @memberof IIssueTsoCmdOpts
     */
    addressSpaceOptions?: IStartTsoParms;

    /**
     * z/OS >2.4 TSO Command statefulness of address space
     * @type {boolean}
     * @memberof IIssueTsoCmdOpts
     */
    isStateful?: boolean;

    /**
     * suppressing broadcast message from TSO address space
     * @type {boolean}
     * @memberof IIssueTsoCmdOpts
     */
    suppressStartupMessages?: boolean;
}
