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
 * This interface defines the information that is stored in the download data set API return object
 */
export interface ISearchMatchLocation {

    /**
     * The line number that the match was found in
     */
    line: number;

    /**
     * The column number that the match was found in
     */
    column: number;

    /**
     * The contents of that line where the search term was found
     */
    contents: string;
}
