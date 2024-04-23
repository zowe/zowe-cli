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

import { AbstractSession, ImperativeError, TaskStage } from "@zowe/imperative";

import { List } from "../list";
import { ISearchItem } from "./doc/ISearchItem";
import { Get } from "../get";
import { ISearchMatchLocation } from "./doc/ISearchMatchLocation";
import { asyncPool } from "@zowe/core-for-zowe-sdk";
import { ISearchOptions } from "./doc/ISearchOptions";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";

interface ISearchResponse {
    responses: ISearchItem[],
    failures: string[]
}

/**
 * This class holds helper functions that are used to list data sets and its members through the z/OS MF APIs
 */
export class Search {

    /* Flag for an expired timeout */
    private static timerExpired: boolean = false;

    /**
     * Retrieve all data sets and members to search
     *
     * @param {AbstractSession}  session          - z/OS MF connection info
     * @param {ISearchOptions}   searchOptions    - contains the data set search options, including name, query, timeout, and threads
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     */

    public static async search(session: AbstractSession, searchOptions: ISearchOptions): Promise<IZosFilesResponse> {

        let timer: NodeJS.Timeout = undefined;
        const failedDatasets: string[] = [];
        this.timerExpired = false;

        // Handle timeouts
        if (searchOptions.timeout) {
            timer = setTimeout(() => {
                timer = null;
                this.timerExpired = true;
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            }, searchOptions.timeout * 1000);
        }

        // Handle progress bars
        if (searchOptions.progressTask) {
            searchOptions.progressTask.stageName = TaskStage.IN_PROGRESS;
            searchOptions.progressTask.percentComplete = 0;
            searchOptions.progressTask.statusMessage = "Getting search list...";
        }

        // Handle case sensitivity
        if (searchOptions.caseSensitive == null || searchOptions.caseSensitive === false) {
            searchOptions.query = searchOptions.query.toLowerCase();
        }

        // List all data sets that match the search term
        let searchItems: ISearchItem[] = [];
        const partitionedDataSets: string[] = [];

        // We are in trouble if list fails - exit if it does
        try {
            const response = await List.dataSetsMatchingPattern(session, [searchOptions.dataSetName], {
                ...searchOptions.listOptions,
                maxConcurrentRequests: searchOptions.threads
            });
            for (const resp of response.apiResponse) {
                // Skip anything that doesn't have a DSORG or is migrated
                if (resp.dsorg && !(resp.migr && resp.migr.toLowerCase() === "yes")) {
                    if (resp.dsorg === "PS") {                                      // Sequential
                        searchItems.push({dsname: resp.dsname});
                    } else if (resp.dsorg === "PO" || resp.dsorg === "PO-E") {      // Partitioned
                        partitionedDataSets.push(resp.dsname);
                    }
                }
            }
        } catch (err) {
            throw new ImperativeError({msg: "Failed to get list of data sets to search", causeErrors: err});
        }

        // Get a list of members if a data set is a PDS
        for (const pds of partitionedDataSets) {
            try {
                const response = await List.allMembers(session, pds, searchOptions.listOptions);
                if (response.apiResponse.items.length > 0) {
                    for (const item of response.apiResponse.items) {
                        if (item.member != undefined) { searchItems.push({dsname: pds, memname: item.member}); }
                    }
                }
            } catch (err) {
                failedDatasets.push(pds);
            }
        }

        // Start searching on the mainframe if applicable
        if (searchOptions.mainframeSearch) {
            const response = await this.searchOnMainframe(session, searchOptions, searchItems);
            searchItems = response.responses;
            failedDatasets.push(...response.failures);
        }

        // Start searching locally
        const response = await this.searchLocal(session, searchOptions, searchItems);
        const matchResponses = response.responses;
        failedDatasets.push(...response.failures);

        if (timer) {
            clearTimeout(timer);
        }

        if (this.timerExpired) {
            this.timerExpired = false;
            if (searchOptions.progressTask) {
                searchOptions.progressTask.stageName = TaskStage.FAILED;
                searchOptions.progressTask.percentComplete = 100;
                searchOptions.progressTask.statusMessage = "Operation timed out";
            }
        } else if (searchOptions.progressTask) {
            searchOptions.progressTask.stageName = TaskStage.COMPLETE;
            searchOptions.progressTask.percentComplete = 100;
            searchOptions.progressTask.statusMessage = "Search complete";
        }

        // Sort responses to make it pretty
        matchResponses.sort((a, b) => {
            const sort = a.dsname.localeCompare(b.dsname);
            if (sort === 0) {
                return a.memname.localeCompare(b.memname);
            } else {
                return sort;
            }
        });

        const apiResponse: IZosFilesResponse = {
            success: failedDatasets.length >= 1 ? true : false,
            commandResponse: "Found \"" + searchOptions.query + "\" in " + matchResponses.length + " data sets and PDS members",
            apiResponse: matchResponses
        };

        if (matchResponses.length >= 1) {
            apiResponse.commandResponse += ":\n";
            for (const entry of matchResponses) {
                apiResponse.commandResponse += "\nData Set \"" + entry.dsname + "\"";

                if (entry.memname) { apiResponse.commandResponse += " | Member \"" + entry.memname + "\":\n"; }
                else { apiResponse.commandResponse += ":\n"; }

                for (const {line, column, contents} of entry.matchList) {
                    apiResponse.commandResponse += "Line: " + line + ", Column: " + column + ", Contents: " + contents + "\n";
                }
            }
        } else {
            apiResponse.commandResponse += ".";
        }

        if (apiResponse.success != true ) {
            apiResponse.errorMessage = "The following data set(s) failed to be searched: \n";
            for (const entry of failedDatasets) { apiResponse.errorMessage += entry + "\n"; }
        }

        return apiResponse;
    }

    /**
     * Perform a prelimiary search on z/OSMF
     *
     * @param {AbstractSession}  session       - z/OS MF connection info
     * @param {ISearchOptions}   searchOptions - Search options
     * @param {ISearchItem[]}    searchItems   - List of items for searching
     *
     * @returns {Promise<string[]>} A list of members that contain the searched for term
     *
     * @throws {ImperativeError} when a download fails, or timeout is exceeded.
     */
    private static async searchOnMainframe(session: AbstractSession, searchOptions: ISearchOptions, searchItems: ISearchItem[]):
    Promise<ISearchResponse> {
        const matches: ISearchItem[] = [];
        const failures: string[] = [];
        const total = searchItems.length;
        let complete = 0;

        const createSearchPromise = async (searchItem: ISearchItem) => {
            if (!this.timerExpired) {
                // Update the progress bar
                if (searchOptions.progressTask) {
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    searchOptions.progressTask.percentComplete = Math.floor(((complete / total) / 2) * 100);
                    searchOptions.progressTask.statusMessage = "Initial Mainframe Search: " + complete + " of " + total + " entries checked";
                }

                // Set up the query
                let queryParams = "?search=" + encodeURIComponent(searchOptions.query) + "&maxreturnsize=1";
                if (searchOptions.caseSensitive === true) { queryParams += "&insensitive=false"; }
                let dsname = searchItem.dsname;
                if (searchItem.memname) { dsname += "(" + searchItem.memname + ")"; }

                // Get the response from the mainframe
                let getResponseBuffer: Buffer;
                try {
                    getResponseBuffer = await Get.dataSet(session, dsname, {...searchOptions.getOptions, queryParams});
                } catch (err) {
                    failures.push(dsname);
                    complete++;
                    return;
                }
                if (!(getResponseBuffer == null || getResponseBuffer.byteLength === 0)) {
                    matches.push(searchItem);
                }
                complete++;
            } else {
                if (searchItem.memname) {
                    failures.push(searchItem.dsname + "(" + searchItem.memname + ")");
                } else {
                    failures.push(searchItem.dsname);
                }
                complete++;
            }
        };

        if (!this.timerExpired) { await asyncPool(searchOptions.threads || 1, searchItems, createSearchPromise); }
        return {responses: matches, failures};
    }

    /**
     * Perform a deep search locally
     *
     * @param {AbstractSession}  session       - z/OS MF connection info
     * @param {ISearchOptions}   searchOptions - Search options
     *
     * @returns {Promise<IZosFilesMatchResponse[]>} A list of members that contain the searched for term, and locations where the term appears
     *
     * @throws {ImperativeError} when a download fails, or timeout is exceeded.
     */
    private static async searchLocal(session: AbstractSession, searchOptions: ISearchOptions, searchItems: ISearchItem[]): Promise<ISearchResponse> {
        const matchedItems: ISearchItem[] = [];
        const failures: string[] = [];
        const total = searchItems.length;
        let complete = 0;
        const createFindPromise = async (searchItem: ISearchItem) => {
            if (!this.timerExpired) {
                // Handle the progress bars
                if (searchOptions.progressTask) {
                    if (searchOptions.mainframeSearch) {
                        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                        searchOptions.progressTask.percentComplete = Math.floor((((complete / total) / 2) * 100) + 50);
                        searchOptions.progressTask.statusMessage = "Performing Deep Search: " + complete + " of " + total + " entries checked";
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                        searchOptions.progressTask.percentComplete = Math.floor(((complete / total) * 100));
                        searchOptions.progressTask.statusMessage = "Performing Deep Search: " + complete + " of " + total + " entries checked";
                    }
                }

                // Set up the query
                let dsname = searchItem.dsname;
                if (searchItem.memname) { dsname += "(" + searchItem.memname + ")"; }

                // Get the item
                let getResponseBuffer: Buffer;
                try {
                    getResponseBuffer = await Get.dataSet(session, dsname, searchOptions.getOptions);
                } catch (err) {
                    failures.push(dsname);
                    complete++;
                    return;
                }
                let getResponseString = getResponseBuffer.toString();
                if (searchOptions.caseSensitive == undefined || searchOptions.caseSensitive === false) {
                    getResponseString = getResponseString.toLowerCase();
                }
                const getResponseStringArray = getResponseString.split(/\r?\n/);

                // Perform the search
                const indicies: ISearchMatchLocation[] = [];
                let lineNum = 0;
                for (const line of getResponseStringArray) {
                    if (line.includes(searchOptions.query)) {
                        let lastCol = 0;
                        while (lastCol != -1) {
                            const column = line.indexOf(searchOptions.query, lastCol + searchOptions.query.length);
                            lastCol = column;
                            if (column != -1) {
                                indicies.push({line: lineNum, column, contents: line});
                            }
                        }
                    }
                    lineNum++;
                }
                if (indicies.length > 0) {
                    searchItem.matchList = indicies;
                    matchedItems.push(searchItem);
                }
                complete++;
            } else {
                if (searchItem.memname) {
                    failures.push(searchItem.dsname + "(" + searchItem.memname + ")");
                } else {
                    failures.push(searchItem.dsname);
                }
                complete++;
            }
        };
        if (!this.timerExpired) { await asyncPool(searchOptions.threads || 1, searchItems, createFindPromise); }
        return {responses: matchedItems, failures};
    }
}
