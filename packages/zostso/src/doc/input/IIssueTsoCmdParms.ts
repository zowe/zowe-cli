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

export interface IIssueTsoCmdParms {
    /**
     * command being ran on TSO address space
     * @type {string}
     * @memberof IIssueTsoCmdParms
     */
    command: string;

    /**
     * z/OS >2.4 TSO Command statefulness of address space
     * @type {boolean}
     * @memberof IIssueTsoCmdParms
     */
    isStateful?: boolean;

    /**
     * current version of z/OS connection
     * @type {string}
     * @memberof IIssueTsoCmdParms
     */
    version?: string;
}
