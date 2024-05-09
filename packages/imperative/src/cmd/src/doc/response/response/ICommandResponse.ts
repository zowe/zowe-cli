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

import { IImperativeError } from "../../../../../error";

/**
 * Command response object built by the command processor (and command handler). The response object is always
 * built internally, but displayed to the command issuer if response-format-json is specified.
 *
 * For handlers, see the HandlerResponse (IHandlerResponseApi) for the public APIs used to by handlers to create
 * this response.
 * @export
 * @interface ICommandResponse
 */
export interface ICommandResponse {
    /**
     * Overall command success flag. True indicates that the command handler/processor/help was successful.
     * @type {boolean}
     * @memberof ICommandResponse
     */
    success: boolean;
    /**
     * Requested exit code for the process when your command is complete.
     * If this is not specified, the default is 0 for successful commands and 1 for failed commands
     * according to the value of the above "success" field.
     * @type {number}
     * @memberof ICommandResponse
     */
    exitCode: number;
    /**
     * Message appended by the handlers. The message is not displayed on the console, only displayed if response format
     * JSON is indicated.
     * @type {string}
     * @memberof ICommandResponse
     */
    message: string;
    /**
     * The stdout from the command. Buffered regardless of response format specification.
     * @type {Buffer}
     * @memberof ICommandResponse
     */
    stdout?: Buffer;
    /**
     * The stderr from the command. Buffered regardless of response format specification.
     * @type {Buffer}
     * @memberof ICommandResponse
     */
    stderr?: Buffer;
    /**
     * Handlers (and help, etc.) can choose to append a data object to the response. Not displayed to the console
     * unless response format JSON is specified.
     * @type {*}
     * @memberof ICommandResponse
     */
    data?: any;
    /**
     * Error object automatically appended by the command processor when a handler rejects the promise. Contains the
     * stack and other messages to help diagnosis. Not displayed to the console unless response format JSON is specified.
     * @type {IImperativeError}
     * @memberof ICommandResponse
     */
    error?: IImperativeError;
}
