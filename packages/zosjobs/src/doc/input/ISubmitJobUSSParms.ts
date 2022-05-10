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
 * Interface for submit job API
 * @export
 * @interface ISubmitJobUSSParms
 */
export interface ISubmitJobUSSParms {

    /**
     * USS File which should contain syntactically correct JCL
     * Example value: /u/users/ibmuser
     * where IEFBR14 contains statements like:
     *   //IEFBR14 JOB ()
     *   //RUN     EXEC PGM=IEFBR14
     * @type {string}
     * @memberof ISubmitJobUSSParms
     */
    jobUSSFile: string;

    /**
     * A string for JCL symbolic substitution
     * @type {string}
     * @memberof ISubmitJobUSSParms
     */
    jclSymbols?: string;
}
