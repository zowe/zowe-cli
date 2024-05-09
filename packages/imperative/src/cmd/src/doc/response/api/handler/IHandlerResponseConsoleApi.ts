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

import { IPromptOptions } from "./IPromptOptions";

/**
 * Handler response API for console messages.
 * @export
 * @interface IHandlerResponseConsoleApi
 */
export interface IHandlerResponseConsoleApi {
    /**
     * Write a message to stdout (or buffers in silent/JSON mode). Automatically appends a newline to the message.
     * @param {string} message - The message (or format string) to write to stdout.
     * @param {...any[]} values - The format string values for substitution/formatting.
     * @returns {string} - The verbatim message written.
     * @memberof IHandlerResponseConsoleApi
     */
    log(message: string | Buffer, ...values: any[]): string;
    /**
     * Write a message to stderr (or buffers in silent/JSON mode). Automatically appends a newline to the message.
     * @param {string} message - The message (or format string) to write to stderr
     * @param {...any[]} values - The format string values for substitution/formatting.
     * @returns {string} - The verbatim message written.
     * @memberof IHandlerResponseConsoleApi
     */
    error(message: string | Buffer, ...values: any[]): string;
    /**
     * Writes an error header to stderr. The header is colorized (to red), appends a colon (e.g. "Syntax Error:"),
     * and a new line. The intention of the error header is to begin an error block of text with a "tag" (the header).
     * @param {string} message - The message as the header.
     * @param {string} [delimiter] - The a delimiter to print after the message (defaults to ":").
     * @returns {string}
     * @memberof IHandlerResponseConsoleApi
     */
    errorHeader(message: string, delimiter?: string): string;
    /**
     * Handles prompting for CLI handlers
     * @param {string} questionText
     * @param {IPromptOptions} [opts]
     * @returns {Promise<String>}
     * @memberof IHandlerResponseConsoleApi
     */
    prompt(questionText: string, opts?: IPromptOptions): Promise<string>;
}
