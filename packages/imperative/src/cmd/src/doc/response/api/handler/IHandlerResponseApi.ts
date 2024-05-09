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

import { IHandlerResponseConsoleApi } from "./IHandlerResponseConsoleApi";
import { IHandlerResponseDataApi } from "./IHandlerResponseDataApi";
import { IHandlerProgressApi } from "./IHandlerProgressApi";
import { IHandlerFormatOutputApi } from "./IHandlerFormatOutputApi";

/**
 * The interface to the object passed to command handlers to formulate responses, print messages, etc. in their
 * command processing. Handlers should never write directly to stdout/stderr.
 * @export
 * @interface ICommandResponseApi
 */
export interface IHandlerResponseApi {
    /**
     * Returns the console API object. Used for writing to stdout and stderr. Also buffers the stdout/stderr messages
     * for population of the ultimate JSON response object.
     * @returns {IHandlerResponseConsoleApi}
     * @memberof IHandlerResponseApi
     */
    console: IHandlerResponseConsoleApi;
    /**
     * The response object is constructed for the purposes of responding to a command with JSON output. The response
     * object houses additional fields and response areas for programmatic API usage of commands.
     * @returns {IHandlerResponseDataApi}
     * @memberof IHandlerResponseApi
     */
    data: IHandlerResponseDataApi;
    /**
     * Apis to create and destroy progress bars during the command.
     * @type {IHandlerProgressApi}
     * @memberof IHandlerResponseApi
     */
    progress: IHandlerProgressApi;
    /**
     * Format and output data according to the defaults specified (and optional overrides specified by the user). Use
     * when printing/prettifying JSON objects/arrays (it can be used with string data, but string data does not benefit
     * from the auto-formatting options). In conjunction with with ""
     * @type {IHandlerFormatOutputApi}
     * @memberof IHandlerResponseApi
     */
    format: IHandlerFormatOutputApi;
}
