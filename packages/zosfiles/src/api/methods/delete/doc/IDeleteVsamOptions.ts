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
 * This interface defines a few optional options that can be sent on a VSAM
 * delete operation.
 */
export interface IDeleteVsamOptions {
    /**
     * Specifies the data component of a cluster is to be
     * overwritten with binary zeros when the cluster is deleted.
     */
    erase?: boolean;

    /**
     * Specifies the entry is to be deleted even if the retention period,
     * specified in the TO or FOR operand, has not expired.
     */
    purge?: boolean;
}
