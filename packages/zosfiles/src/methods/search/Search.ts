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

import { AbstractSession, TextUtils, ImperativeError, ImperativeExpect, TaskStage } from "@zowe/imperative";

import { List } from "../list";
import { ISearchItem } from "./doc/ISearchItem";
import { Get } from "../get";
import { ISearchMatchLocation } from "./doc/ISearchMatchLocation";
import { asyncPool } from "@zowe/core-for-zowe-sdk";
import { ISearchOptions } from "./doc/ISearchOptions";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";

// This interface isn't used outside of the private functions, so just keeping it here.
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
     * @param {ISearchOptions}   searchOptions    - contains the data set search options,
     *                                              including name, searchString, timeout, and maxConcurrentRequests
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     */

    public static async dataSets(session: AbstractSession, searchOptions: ISearchOptions): Promise<IZosFilesResponse> {
        ImperativeExpect.toBeDefinedAndNonBlank(searchOptions.pattern, "pattern");
        ImperativeExpect.toBeDefinedAndNonBlank(searchOptions.searchString, "searchString");

        const failedDatasets: string[] = [];
        const origSearchQuery = searchOptions.searchString;
        let timer: NodeJS.Timeout;
        this.timerExpired = false;

        // Handle timeouts
        if (searchOptions.timeout) {
            timer = setTimeout(() => {
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

        // List all data sets that match the search term
        let searchItems: ISearchItem[] = [];
        const partitionedDataSets: string[] = [];

        // We are in trouble if list fails - exit if it does
        try {
            const response = await List.dataSetsMatchingPattern(session, [searchOptions.pattern], {
                ...searchOptions.listOptions,
                maxConcurrentRequests: searchOptions.maxConcurrentRequests
            });
            for (const resp of response.apiResponse) {
                // Skip anything that doesn't have a DSORG or is migrated
                if (resp.dsorg && !(resp.migr && resp.migr.toLowerCase() === "yes")) {
                    if (resp.dsorg === "PS") {                                      // Sequential
                        searchItems.push({dsn: resp.dsname});
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
                        if (item.member != undefined) { searchItems.push({dsn: pds, member: item.member}); }
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

        if (searchOptions.progressTask) {
            if (this.timerExpired && failedDatasets.length >= 1) {
                searchOptions.progressTask.stageName = TaskStage.FAILED;
                searchOptions.progressTask.percentComplete = 100;
                searchOptions.progressTask.statusMessage = "Operation timed out";
            } else {
                searchOptions.progressTask.stageName = TaskStage.COMPLETE;
                searchOptions.progressTask.percentComplete = 100;
                searchOptions.progressTask.statusMessage = "Search complete";
            }
        }

        if (this.timerExpired) { this.timerExpired = false; }
        if (timer) {
            clearTimeout(timer);
        }

        // Sort responses to make it pretty
        matchResponses.sort((a, b) => {
            const sort = a.dsn.localeCompare(b.dsn);
            if (sort === 0) {
                return a.member.localeCompare(b.member);
            } else {
                return sort;
            }
        });

        const chalk = TextUtils.chalk;

        const apiResponse: IZosFilesResponse = {
            success: failedDatasets.length <= 0,
            commandResponse: "Found \"" + chalk.yellow(origSearchQuery) + "\" in " +
                chalk.yellow(matchResponses.length) + " data sets and PDS members",
            apiResponse: matchResponses
        };

        if (matchResponses.length >= 1) {
            apiResponse.commandResponse += ":\n";
            for (const entry of matchResponses) {
                apiResponse.commandResponse += "\n" + chalk.yellow("Data Set") + " \"" + entry.dsn + "\"";

                if (entry.member) { apiResponse.commandResponse += " | " + chalk.yellow("Member") + " \"" + entry.member + "\":\n"; }
                else { apiResponse.commandResponse += ":\n"; }

                let maxLine: number = 0;
                let maxCol: number = 0;
                for (const {line, column} of entry.matchList) {
                    if (line > maxLine) { maxLine = line; }
                    if (column > maxCol) { maxCol = column; }
                }

                const lineLen = maxLine.toString().length;
                const colLen = maxCol.toString().length;

                for (const {line, column, contents} of entry.matchList) {
                    // eslint-disable-next-line no-control-regex
                    let localContents = contents.replace(/[\u0000-\u001F\u007F-\u009F]/g, "\uFFFD");
                    const beforeString = localContents.substring(0, column - 1);
                    const selectedString = chalk.bgYellow(localContents.substring(column - 1, column - 1 + searchOptions.searchString.length));
                    const afterString = localContents.substring(column - 1 + searchOptions.searchString.length, localContents.length + 1);
                    localContents = beforeString + selectedString + afterString;
                    apiResponse.commandResponse += chalk.yellow("Line:") + " " + line.toString().padStart(lineLen) +
                        ", " + chalk.yellow("Column:") + " " + column.toString().padStart(colLen) + ", " + chalk.yellow("Contents:") +
                        " " + localContents + "\n";
                }
            }
        } else {
            apiResponse.commandResponse += ".";
        }

        if (!apiResponse.success) {
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
                    searchOptions.progressTask.statusMessage = "Initial mainframe search: " + complete + " of " + total + " entries checked";
                }

                // Handle case sensitivity
                if (searchOptions.caseSensitive == undefined || searchOptions.caseSensitive === false) {
                    searchOptions.searchString = searchOptions.searchString.toLowerCase();
                }

                // Set up the query
                let queryParams = "?search=" + encodeURIComponent(searchOptions.searchString) + "&maxreturnsize=1";
                if (searchOptions.caseSensitive === true) { queryParams += "&insensitive=false"; }
                let dsn = searchItem.dsn;
                if (searchItem.member) { dsn += "(" + searchItem.member + ")"; }

                // Get the response from the mainframe
                let getResponseBuffer: Buffer;
                try {
                    getResponseBuffer = await Get.dataSet(session, dsn, {...searchOptions.getOptions, queryParams});
                } catch (err) {
                    failures.push(dsn);
                    complete++;
                    return;
                }
                if (!(getResponseBuffer == null || getResponseBuffer.byteLength === 0)) {
                    matches.push(searchItem);
                }
                complete++;
            } else {
                if (searchItem.member) {
                    failures.push(searchItem.dsn + "(" + searchItem.member + ")");
                } else {
                    failures.push(searchItem.dsn);
                }
                complete++;
            }
        };

        await asyncPool(searchOptions.maxConcurrentRequests || 1, searchItems, createSearchPromise);
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
                        searchOptions.progressTask.statusMessage = "Performing search: " + complete + " of " + total + " entries checked";
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                        searchOptions.progressTask.percentComplete = Math.floor(((complete / total) * 100));
                        searchOptions.progressTask.statusMessage = "Performing Search: " + complete + " of " + total + " entries checked";
                    }
                }

                // Set up the query
                let dsn = searchItem.dsn;
                if (searchItem.member) { dsn += "(" + searchItem.member + ")"; }

                // Get the item
                let getResponseBuffer: Buffer;
                try {
                    getResponseBuffer = await Get.dataSet(session, dsn, searchOptions.getOptions);
                } catch (err) {
                    failures.push(dsn);
                    complete++;
                    return;
                }
                const getResponseString = getResponseBuffer.toString();
                const getResponseStringArray = getResponseString.split(/\r?\n/);

                // Handle case sensitivity
                if (searchOptions.caseSensitive == undefined || searchOptions.caseSensitive === false) {
                    searchOptions.searchString = searchOptions.searchString.toLowerCase();
                }

                // Perform the search
                const indicies: ISearchMatchLocation[] = [];
                let lineNum = 0;
                for (const line of getResponseStringArray) {
                    // Handle temporary storage of comparison data - we want the original to return to the caller
                    let searchLine = line;
                    if (searchOptions.caseSensitive == undefined || searchOptions.caseSensitive === false) {
                        searchLine = line.toLowerCase();
                    }

                    if (searchLine.includes(searchOptions.searchString)) {
                        let lastCol = 0;
                        while (lastCol != -1) {
                            const column = searchLine.indexOf(searchOptions.searchString, lastCol + searchOptions.searchString.length);
                            lastCol = column;
                            if (column != -1) {
                                // Append the real line - 1 indexed
                                indicies.push({line: lineNum + 1, column: column + 1, contents: line});
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
                if (searchItem.member) {
                    failures.push(searchItem.dsn + "(" + searchItem.member + ")");
                } else {
                    failures.push(searchItem.dsn);
                }
                complete++;
            }
        };
        await asyncPool(searchOptions.maxConcurrentRequests || 1, searchItems, createFindPromise);
        return {responses: matchedItems, failures};
    }
}
