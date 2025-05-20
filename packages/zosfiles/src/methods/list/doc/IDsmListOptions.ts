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

import { ITaskWithStatus } from "npm:@zowe/imperative";
import { IListOptions } from "./IListOptions";

/**
 * This interface defines the options that can be sent into the list data sets matching function
 */
export interface IDsmListOptions extends Omit<IListOptions, "pattern"> {
    /**
     * Exclude data sets that match these DSLEVEL patterns. Any data sets that match
     * this pattern will not be listed
     * @example "ibmuser.**.jcl, ibmuser.rexa.*"
     */
    excludePatterns?: string[];

    /**
     * The maximum REST requests to perform at once
     * Increasing this value results in faster requests but increases resource consumption
     * on z/OS and risks encountering an error caused
     * by making too many requests at once.
     * Default: 1
     */
    maxConcurrentRequests?: number;

    /**
     * Task status object used by CLI handlers to create progress bars
     * Optional
     * @type {ITaskWithStatus}
     */
    task?: ITaskWithStatus;
}
