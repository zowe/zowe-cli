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

import { CommandResponse } from "./CommandResponse";
import { IHandlerResponseDataApi } from "../doc/response/api/handler/IHandlerResponseDataApi";
import { IHandlerResponseConsoleApi } from "../doc/response/api/handler/IHandlerResponseConsoleApi";
import { IHandlerResponseApi } from "../doc/response/api/handler/IHandlerResponseApi";
import { IHandlerProgressApi } from "../doc/response/api/handler/IHandlerProgressApi";
import { IHandlerFormatOutputApi } from "../doc/response/api/handler/IHandlerFormatOutputApi";

/**
 * Handler command response APIs. Passed to command handlers for console messages, data responses, and progress bars.
 * Handlers can implement their own logging scheme (or use the Imperative.api to obtain an instance of the logger),
 * but handlers should NEVER write directly to the console and should always use the APIs here to construct responses.
 * The HandlerResponse object will automatically handle response formats, etc.
 * @export
 * @class HandlerResponse
 * @implements {IHandlerResponseApi}
 */
export class HandlerResponse implements IHandlerResponseApi {
    /**
     * The command response object allocated by the command processor that exposes the APIs intended for the handler
     * to use.
     * @private
     * @type {CommandResponse}
     * @memberof HandlerResponse
     */
    private mApis: CommandResponse;
    /**
     * Creates an instance of HandlerResponse.
     * @param {CommandResponse} apis - The command response object (See class for details) - contains all the public
     * APIs that the handler should use to formulate responses.
     * @memberof HandlerResponse
     */
    constructor(apis: CommandResponse) {
        this.mApis = apis;
    }
    /**
     * Returns the instance of the console APIs for the handler. Provides APIs to console messaging (log, error,
     * etc.).
     * @readonly
     * @type {IHandlerResponseConsoleApi} - See the interface for API details.
     * @memberof HandlerResponse
     */
    public get console(): IHandlerResponseConsoleApi {
        return this.mApis.console;
    }
    /**
     * Returns the instance of the data APIs for the handler. Provides APIs for the handlers to formulate
     * their JSON response objects to the command.
     * @readonly
     * @type {IHandlerResponseDataApi} - See the interface for API details.
     * @memberof HandlerResponse
     */
    public get data(): IHandlerResponseDataApi {
        return this.mApis.data;
    }
    /**
     * Returns the instance of the progress bar APIs for the handler. Provides methods to start and end progress bars.
     * @readonly
     * @type {IHandlerProgressApi} - See the interface for API details.
     * @memberof HandlerResponse
     */
    public get progress(): IHandlerProgressApi {
        return this.mApis.progress;
    }

    /**
     * Returns the instance of the format APIs for the handler. APIs allow the handler to provide output objects/strings
     * and they will be automatically formatted and printed to the console.
     * @readonly
     * @type {IHandlerFormatOutputApi}
     * @memberof HandlerResponse
     */
    public get format(): IHandlerFormatOutputApi {
        return this.mApis.format;
    }
}
