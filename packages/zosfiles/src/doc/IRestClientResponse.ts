
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

import { Session, Logger } from "@zowe/imperative";

/**
 * Interface to map client's REST call response
 * @export
 * @interface IRestClientResponse
 */
export interface IRestClientResponse {

    /**
     * Status whether or not a REST request was successful by HTTP status code
     * @type {boolean}
     * @memberof IRestClientResponse
     */
    requestSuccess?: boolean;

    /**
     * Status whether or not a REST request was successful by HTTP status code
     * Reverse of requestSuccess
     * @type {boolean}
     * @memberof IRestClientResponse
     */
    requestFailure?: boolean;

    /**
     * Http(s) response body as a buffer
     * @type {Buffer}
     * @memberof IRestClientResponse
     */
    data?: Buffer;

    /**
     * Http(s) response body as a string
     * @type {string}
     * @memberof IRestClientResponse
     */
    dataString?: string;

    /**
     * Http(s) response object
     * @type {any}
     * @memberof IRestClientResponse
     */
    response?: any;

    /**
     * Session object
     * @type {Session}
     * @memberof IRestClientResponse
     */
    session?: Session;

    /**
     * Logger object
     * @type {Logger}
     * @memberof IRestClientResponse
     */
    log?: Logger;
}
