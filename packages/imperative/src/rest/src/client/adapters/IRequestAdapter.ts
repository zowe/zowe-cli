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
import { Writable, Readable } from "stream";
import { ITaskWithStatus } from "../../../../operations";

/**
 * Interface for HTTP request adapters
 * @export
 * @interface IRequestAdapter
 */
export interface IRequestAdapter {
    /**
     * Make an HTTP request
     * @param {string} resource - URI for this request
     * @param {HTTP_VERB} request - REST request type GET|PUT|POST|DELETE
     * @param {any[]} reqHeaders - Headers to include with request
     * @param {any} writeData - Data to write on this REST request
     * @param {Writable} responseStream - Stream for incoming response data
     * @param {Readable} requestStream - Stream for outgoing request data
     * @param {boolean} normalizeResponseNewLines - Normalize response newlines
     * @param {boolean} normalizeRequestNewLines - Normalize request newlines
     * @param {ITaskWithStatus} task - Task for progress tracking
     * @returns {Promise<string>} - Response data as string
     */
    request(
        resource: string,
        request: HTTP_VERB,
        reqHeaders?: any[],
        writeData?: any,
        responseStream?: Writable,
        requestStream?: Readable,
        normalizeResponseNewLines?: boolean,
        normalizeRequestNewLines?: boolean,
        task?: ITaskWithStatus
    ): Promise<string>;
} 