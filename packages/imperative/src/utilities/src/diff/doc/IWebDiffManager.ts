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
 * Web diff manager API that handles launching of web diff and generating it if necessary.
 * @export
 * @interface IWebDiffManager
 */
export interface IWebDiffManager {
    /**
     * launch the diff of two file in web
     * @param {string} content Html content string to launch in web
     */
    openDiffs(content: string): void;

}
