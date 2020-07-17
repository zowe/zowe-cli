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
 * This interface defines the global options that apply to all zosfiles APIs
 * @export
 * @interface IGlobalOptions
 */
export interface IGlobalOptions {
    /**
     * The maximum amount of time for the TSO servlet to wait for a response before returning an error
     * @type {number}
     */
    responseTimeout?: number;
}