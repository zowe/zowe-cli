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

export class JobTestsUtils {

    /**
     * Get IEFBR14 JCL to submit on the user's behalf for the test
     * @param {string} jobnamePrefix - prefix to use with the job name e.g. the user id
     * @param account - jes accounting info for the user
     * @returns {string} - the jcl to submit
     */
    public static getIefbr14JCL(jobnamePrefix: string = "IEFBR", account: string) {
        const maxJobNamePrefixLength = 5;
        return "//" + jobnamePrefix.substring(0, maxJobNamePrefixLength).toUpperCase() + "D JOB '" + account +
            "','Zowe Test',MSGLEVEL=(1,1),\n" +
            "// MSGCLASS=A,CLASS=C\n" +
            "//STEP1 EXEC PGM=IEFBR14";
    }
}
