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
 * Interface for change job z/OSMF API
 * @export
 * @interface IModifyJobOptions
 */
export interface IModifyJobOptions {
    /**
     * new job class to change job to
     * @type {string}
     * @memberof IModifyJobOptions
     */
    jobclass?: string;

    /**
     * specify this option as `true` when wanting to hold your job
     * @type {boolean}
     * @memberof IModifyJobOptions
     */
    hold?: boolean;

    /**
     * specify this option as `true` when wanting to release your job
     * @type {boolean}
     * @memberof IModifyJobOptions
     */
    release?: boolean;
}
