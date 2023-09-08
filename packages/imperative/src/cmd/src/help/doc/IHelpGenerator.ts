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
 * Help generator API. See the AbstractHelpGenerator+DefaultHelpGenerator for the base implementation.
 * @export
 * @interface IHelpGenerator
 */
export interface IHelpGenerator {
    /**
     * Constructs the help text for a command/group.
     * @returns {string}
     * @memberof IHelpGenerator
     */
    buildHelp(): string;
}
