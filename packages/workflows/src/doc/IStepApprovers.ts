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

/**
 * Interface for Step approver object.
 * @export
 * @interface IStepApprovers
 */
// step definition approvers object (subtable 5)
export interface IStepApprovers {
    /**
     * Id or ids separated by spaces
     * @type {string}
     * @memberof IStepApprovers
     */
    approver: string;

    /**
     * Whether in id is substitution.
     * @type {boolean}
     * @memberof IStepApprovers
     */
    approverSub: boolean;
}
