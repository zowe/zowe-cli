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

import { HTTP_VERB } from "../types/HTTPVerb";
import { Writable, Readable } from "node:stream";
import { ITaskWithStatus } from "../../../../operations";

/**
 * Interface to define input for AbstractRestClient.request method
 * @export
 * @interface IRestOptions
 */
export interface IRestOptions {

    /**
     * URI for this request
     * @type {string}
     * @memberof IRestOptions
     */
    resource: string;

    /**
     * REST request type GET|PUT|POST|DELETE
     * @type {HTTP_VERB}
     * @memberof IRestOptions
     */
    request: HTTP_VERB;

    /**
     * Headers to include with request
     * @type {any[]}
     * @memberof IRestOptions
     */
    reqHeaders?: any[];

    /**
     * Data to write on this REST request
     * @type {*}
     * @memberof IRestOptions
     */
    writeData?: any;

    /**
     * Stream for incoming response data from the server. If specified, response data will not be buffered
     * @type {Writable}
     * @memberof IRestOptions
     */
    responseStream?: Writable;

    /**
     * Stream for outgoing request data to the server
     * @type {Readable}
     * @memberof IRestOptions
     */
    requestStream?: Readable;

    /**
     * true if you want newlines to be \r\n on windows
     * when receiving data from the server to responseStream. Don't set this for binary responses
     * @type {boolean}
     * @memberof IRestOptions
     */
    normalizeResponseNewLines?: boolean;

    /**
     * true if you want \r\n to be replaced with \n when sending
     * data to the server from requestStream. Don't set this for binary requests
     * @type {boolean}
     * @memberof IRestOptions
     */
    normalizeRequestNewLines?: boolean;

    /**
     * Task that will automatically be updated to report progress of upload or download to user
     * @type {ITaskWithStatus}
     * @memberof IRestOptions
     */
    task?: ITaskWithStatus;
}
