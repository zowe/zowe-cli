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
 * Interface for prompt options
 * @export
 * @interface IPromptOptions
 */
export interface IPromptOptions {

    /**
     * Whether or not to obscure answered prompt (e.g. for passwords)
     * @type {boolean}
     * @memberof IPromptOptions
     */
    hideText?: boolean;

    /**
     * How long to wait in seconds for prompting
     * @type {number}
     * @memberof IPromptOptions
     */
    secToWait?: number;

    /**
     * Character to use for masking hidden text
     * @type {string}
     * @memberof IPromptOptions
     */
    maskChar?: string | null;
}
