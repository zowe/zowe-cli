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

import { RestClient, Headers } from "../../../../../src";


/**
 * Class to handle http(s) requests, build headers, collect data, report status codes, and header responses
 * and passes control to session object for maintaining connection information (tokens, checking for timeout, etc...)
 * @export
 * @class CustomRestClient
 * @extends {RestClient}
 */
export class CustomRestClient extends RestClient {

    /**
     * Append specific headers to the callers headers for cases
     * where a header is common to every request.
     * @param {any[] | undefined} headers - current header array
     * @memberof ZosmfRestClient
     */
    protected appendHeaders(headers: any[] | undefined): any[] {
        if (headers == null) {
            return [Headers.APPLICATION_JSON];
        } else {
            headers.push(Headers.APPLICATION_JSON);
            return headers;
        }
    }
}
