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

import { AbstractSession } from "@zowe/imperative";
import { IJob } from "../../../packages/zosjobs";

/**
 * Represents the resources used within the test environment.
 * @export
 * @interface ITestEnvironmentResources
 */
export interface ITestEnvironmentResources {
    /**
     * Array of local file paths used within the test environment.
     * @type {string[]}
     */
    localFiles: string[];

    /**
     * Array of mainframe uss files used within the test environment.
     * @type {string[]}
     */
    files: string[];

    /**
     * Array of job objects or job IDs representing jobs submitted to the mainframe during the test.
     * @type {IJob[]}
     */
    jobs: (IJob | string)[];

    /**
     * Array of dataset names used within the test environment.
     * @type {string[]}
     */
    datasets: string[];

    /**
     * The session used for interacting with z/OS systems during the test, if applicable.
     * @type {AbstractSession}
     */
    session?: AbstractSession;
}
