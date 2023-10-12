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
 * Interface describing syntax validation rule where specifying a certain
 * value means that the user must also specify other options
 */
export interface ICommandOptionValueImplications {
    /**
     * What option names are implied if the value in question is specified
     * @type {string[]}
     * @memberOf ICommandOptionValueImplications
     */
    impliedOptionNames: string[];
    /**
     * Is the value case sensitive?
     * If yes, the strings will be compared with "===".
     * Otherwise they will be uppercased before comparing
     * @type {boolean}
     * @memberOf ICommandOptionValueImplications
     */
    isCaseSensitive?: boolean;
}
