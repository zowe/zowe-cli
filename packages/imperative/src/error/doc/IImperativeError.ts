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
 * Defines an error that occurred in the CLI.
 * @export
 * @interface IImperativeError
 */
export interface IImperativeError {

    /**
     * Message text of the error
     * @type {string}
     * @memberof IImperativeError
     */
    msg: string;

    /**
     * Original errors that caused/influenced this one
     * @type {any}
     * @memberof IImperativeError
     */
    causeErrors?: any;

    /**
     * any other extra contextual information (e.g. details pulled out of the cause errors)
     * @type {string}
     * @memberof IImperativeError
     */
    additionalDetails?: string;

    /**
     * Error status
     * @type {string}
     * @memberof IImperativeError
     */
    stack?: string;

    /**
     * If applicable, an error code, for example, HTTP status code surrounding the error
     * @type {string}
     * @memberof IImperativeError
     */
    errorCode?: string;

    /**
     * Whether or not the error should suppress a full error dump, like in Imperative init
     * @type {boolean}
     * @memberof IImperativeError
     */
    suppressDump?: boolean;
}
