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
 * Interface for the options to the create data-set-vsam API.
 * @export
 * @interface ICreateVsamOptions
 */
export interface ICreateVsamOptions {

    /**
     * The data set organization
     * @type {string}
     */
    dsorg?: string;

    /**
     * The unit of space allocation
     * @type {string}
     */
    alcunit?: string;

    /**
     * The primary space allocation
     * @type {number}
     */
    primary?: number;

    /**
     * The secondary space allocation
     * @type {number}
     */
    secondary?: number;

    /**
     * The volumes on which to allocate space
     * @type {string}
     */
    volumes?: string;

    /**
     * The storage class
     * @type {string}
     */
    storeclass?: string;

    /**
     * The management class
     * @type {string}
     */
    mgntclass?: string;

    /**
     * The data class
     * @type {string}
     */
    dataclass?: string;

    /**
     * The number of days for which the VSAM cluster will be retained
     * @type {string}
     */
    retainFor?: number;

    /**
     * The date until which the VSAM cluster will be retained
     * @type {string}
     */
    retainTo?: string;

    /**
     * The indicator that we need to show the attributes
     *
     * DO NOT SEND THIS TO ZOSMF
     *
     * @type {boolean}
     */
    showAttributes?: boolean;
}
