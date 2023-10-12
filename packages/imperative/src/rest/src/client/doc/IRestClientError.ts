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

import { IImperativeError } from "../../../../error";

export type RestErrorSource = "client" | "http";

/**
 * REST client error interface. Extends IImperativeError to provide additional
 * details specified to REST/HTTP errors.
 * @interface IRestClientError
 * @extends {IImperativeError}
 */
export interface IRestClientError extends IImperativeError {
    /**
     * If available, the HTTP error code. This field is deprecated and replaced
     * with "httpStatus".
     * @deprecated
     * @type {string}
     */
    errorCode?: string;
    /**
     * The HTTP status code from the request. Might not be populated if a "client"
     * error occurred (e.g. ECONNREFUSED).
     * @type {number}
     */
    httpStatus?: number;
    /**
     * The "errno" provided from the Node.js http interface. when client.on("error")
     * is invoked.
     * @type {string}
     */
    errno?: string;
    /**
     * The hostname supplied on the session object.
     * @type {string}
     */
    host?: string;
    /**
     * The syscall provided from the Node.js http interface when client.on("error")
     * is invoked. Usually accompanied by an "errno".
     * @type {string}
     */
    syscall?: string;
    /**
     * The protocol used to connect to the remote host. Specified on the session object.
     * @type {string}
     */
    protocol?: string;
    /**
     * The port number of the remote host. Specified on the session object.
     * @type {number}
     */
    port?: number;
    /**
     * The "base path" for the URI. Specified on the session object.
     * @type {string}
     */
    basePath?: string;
    /**
     * The URI or resource of the request being made.
     * @type {string}
     */
    resource?: string;
    /**
     * Any HTTP headers added to the request.
     * @type {any[]}
     */
    headers?: any[];
    /**
     * The request payload.
     * @type {*}
     */
    payload?: any;
    /**
     * The HTTP method/verb (e.g. PUT)
     * @type {string}
     */
    request?: string;
    /**
     * The error "source". Indicates where the error occurred in the REST client.
     * "client" indicates that the error occurred before the request to the remote
     * system could be fulfilled (normally due to network, bad host/port, etc.).
     * "http" indicates that a non-OK HTTP status code was presented.
     * @type {RestErrorSource}
     */
    source: RestErrorSource;
}
