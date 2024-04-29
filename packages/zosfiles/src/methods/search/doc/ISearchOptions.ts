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

import { ITaskWithStatus } from "@zowe/imperative";
import { IGetOptions } from "../../get";
import { IListOptions } from "../../list";

export interface ISearchOptions {
    /* The name of the data set that should be searched */
    dsn: string;

    /* The string to search for in the data set / members */
    searchString: string;

    /* Options for data set get requests */
    getOptions?: IGetOptions;

    /* Options for data set list requests */
    listOptions?: IListOptions;

    /* Should an initial search be done on the mainframe? */
    mainframeSearch?: boolean;

    /* The members of the PDS data set that should be searched */
    members?: string[];

    /* A progress bar task if we want a progress bar */
    progressTask?: ITaskWithStatus;

    /* The number of concurrent requests to use to perform the search */
    maxConcurrentRequests?: number;

    /* The amount of time, in seconds, before a timeout should occur */
    timeout?: number;

    /* The search should be case sensitive */
    caseSensitive?: boolean;
}