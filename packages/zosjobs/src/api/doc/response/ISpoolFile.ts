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
 * Interface of spool file.
 * @export
 * @interface ISpoolFile
 */
export interface ISpoolFile {

    /**
     * Identifier for this spool file.
     */
    id: number;

    /**
     * DD name of job spool file
     */
    ddName: string;

    /**
     * The name of the job step during which this spool file was produced
     */
    stepName: string;

    /**
     * If this spool file was produced during a job procedure step, the
     * name of the step will be here
     */
    procName: string;

    /**
     * Content of the spool file
     */
    data: string;
}
