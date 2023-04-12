import { ICopyDatasetOptions } from "./ICopyDatasetOptions";

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
 * This interface defines the options that can be sent into the copy cross lpar data set function.
 */
export interface ICrossLparCopyDatasetOptions extends ICopyDatasetOptions {
    /**
     * Target volser
     * @type {string}
     */
    targetVolser?: string;

    /**
     * Target management class
     * @type {string}
     */
    targetManagementClass?: string;

    /**
     * Target storage class
     * @type {string}
     */
    targetStorageClass?: string;

    /**
     * Target data class
     * @type {string}
     */
    targetDataClass?: string;

    /**
     * Overwrite option
     * @type {boolean}
     */
    overwrite?: boolean;

    /**
     * Prompt callback that will be invoked before overwiting a data set.
     * @param targetDSN Name of data set that already exists
     * @returns True if target data set should be overwritten
     */
    promptFn?: (targetDSN: string) => Promise<boolean>;
}
