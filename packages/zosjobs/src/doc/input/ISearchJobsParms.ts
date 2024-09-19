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
 * Interface for search jobs z/OSMF API
 * @export
 * @interface ISearchJobsParms
 */
export interface ISearchJobsParms {
    /**
     * job name for the job you want to search
     * @type {string}
     * @memberof ISearchJobsParms
     */
    jobName: string;

    /**
     * The string to search for
     * @type {string}
     * @memberof ISearchJobsParms
     */
    searchString?: string;

    /**
     * The regular expression to search for
     * @type {string}
     * @memberof ISearchJobsParms
     */
    searchRegex?: string;

    /**
     * specify this option as `false` when wanting a case sensitive search
     * @type {boolean}
     * @memberof ISearchJobsParms
     */
    caseInsensitive?: boolean;

    /**
     * specify this option to limit the number of search hits per file
     * @type {number}
     * @memberof ISearchJobsParms
     */
    searchLimit?: number;

    /**
     * specify this option to limit the number of file searched
     * @type {number}
     * @memberof ISearchJobsParms
     */
    fileLimit?: number;
}
