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

// jobfiles object (table 7)

/**
 * Interface for z/OSMF API response.
 * @export { _class as class }
 * @interface IJobFiles
 */
export interface IJobFiles{

    /**
     * Data set number (key).
     * @type {number}
     * @memberof IJobFiles
     */
    id: number;

    /**
     * DDNAME for the data set creation.
     * @type {string}
     * @memberof IJobFiles
     */
    ddname: string;

    /**
     * Number of bytes on spool that is consumed by the spool file.
     * @type {number}
     * @memberof IJobFiles
     */
    "byte-count": number;

    /**
     * Number of records in the spool file.
     * @type {number}
     * @memberof IJobFiles
     */
    "record-count": number;

    /**
     * Class that is assigned to the spool file.
     * @type {string}
     * @export { _class as class }
     * @memberof IJobFiles
     */
    _class: string;

    /**
     * Step name for the step that created this data set.
     * @type {string}
     * @memberof IJobFiles
     */
    stepname?: string;

    /**
     * Procedure name for the step that created this data set.
     * @type {string}
     * @memberof IJobFiles
     */
    procstep?: string;

}
