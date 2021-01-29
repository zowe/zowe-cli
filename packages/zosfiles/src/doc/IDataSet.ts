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
 * Interface for data sets
 *
 * @export
 */
export interface IDataSet {
    /**
     * The name of the data set
     * @type {string}
     */
    dsn: string;

    /**
     * The name of the member
     * @type {string}
     */
    member?: string;
}
