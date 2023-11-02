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

import { IImperativeError } from "../../../../../error/doc/IImperativeError";
import { ICommandResponse } from "../../response/ICommandResponse";
/**
 * The command response format type definition - currently only JSON or default (stdout/stderr) are supported.
 * @export
 */
export type COMMAND_RESPONSE_FORMAT = "json" | "default";
/**
 * Interface for the internal command processor response object, hides the fields that are required to fully build the
 * response from the handlers.
 * @export
 * @interface ICommandProcessorResponseApi
 * @extends {IHandlerResponseApi}
 */
export interface ICommandResponseApi {
    /**
     * Returns the response format that the object was constructed with - indicates how the output should be handled
     * if response format is JSON, then data is buffered until the end and output at that time.
     * @returns {COMMAND_RESPONSE_FORMAT} - The response format for this command.
     * @memberof ICommandProcessorResponseApi
     */
    responseFormat: COMMAND_RESPONSE_FORMAT;
    /**
     * If true, indicates that silent mode is enabled (no output whatsoever is produced by the response object)
     * @returns {boolean}
     * @memberof ICommandProcessorResponseApi
     */
    silent: boolean;
    /**
     * Sets the command success property to false, indicating that the command has failed. Command failure is indicated
     * by the handler rejecting its promise.
     * @memberof ICommandResponseApi
     */
    failed(): void;
    /**
     * Sets the command success property to true, indicating that the command has succeeded. Command success is
     * indicated by the handler fulfilling its promise.
     * @memberof ICommandResponseApi
     */
    succeeded(): void;
    /**
     * If the command is rejected, this will automatically be populated with all the error details from the Imperative
     * Error object.
     * @param {IImperativeError} details
     * @memberof ICommandProcessorResponseApi
     */
    setError(details: IImperativeError): void;
    /**
     * Returns the formed JSON response from the command.
     * @returns {ICommandResponse} - The fully formed JSON response object from the command.
     * @memberof ICommandProcessorResponseApi
     */
    buildJsonResponse(): ICommandResponse;
    /**
     * Writes the command response object to the console. Always written to stdout.
     * @memberof ICommandProcessorResponseApi
     */
    writeJsonResponse(): ICommandResponse;
    /**
     * End any outstanding progress bars.
     * @memberof ICommandResponseApi
     */
    endProgressBar(): void;
}
