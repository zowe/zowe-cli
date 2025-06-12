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
import { IDataSet } from "../../../doc/IDataSet";

export interface ISearchOptions {
    /* The pattern matching the data set(s) that should be searched */
    pattern: string;

    /* The string to search for in the data set / members */
    searchString: string;

    /* Options for data set get requests */
    getOptions?: IGetOptions;

    /* Options for data set list requests */
    listOptions?: IListOptions;

    /* Should an initial search be done on the mainframe? */
    mainframeSearch?: boolean;

    /* A progress bar task if we want a progress bar */
    progressTask?: ITaskWithStatus;

    /* The number of concurrent requests to use to perform the search */
    maxConcurrentRequests?: number;

    /* The amount of time, in seconds, before a timeout should occur */
    timeout?: number;

    /* The search should be case sensitive */
    caseSensitive?: boolean;

    /* Whether the search string is a regular expression */
    regex?: boolean;

    /* Whether the search should only apply to an exact pattern match */
    searchExactName?: boolean;

    /* A function that, if provided, is called with a list of data sets and members that are about to be searched. */
    /* If true, continue search. If false, terminate search. */
    continueSearch?: (dataSets: IDataSet[]) => Promise<boolean> | boolean;

    /* A function that gets called to validate whether or not to abort if a timeout isn't specified. */
    /* If abortSearch returns true, then the search should terminate immediately with the current available results. */
    /* This prevents searches from continuing to run in the background in the case that a user wishes to cancel a search (i.e. in VS Code) */
    abortSearch?: () => boolean;
}
