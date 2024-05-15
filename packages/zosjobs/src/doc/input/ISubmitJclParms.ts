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

import { ISubmitParmsCommon } from "./ISubmitParmsCommon";

/**
 * Interface for submit JCL APIs
 * @export
 * @interface ISubmitJclParms
 */
export interface ISubmitJclParms extends ISubmitParmsCommon {

    /**
     * JCL to submit, for example:
     *   "//IEFBR14 JOB ()\n" +
     *   "//RUN     EXEC PGM=IEFBR14"
     * @type {string}
     * @memberof ISubmitJclParms
     */
    jcl: string;
}
