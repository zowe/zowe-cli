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

import { EventEmitter } from "events";

/**
 * Simulate http(s).clientRequest or http(s).clientRequest callback invoked
 * @export
 * @class MockHttpRequestResponse
 * @extends {EventEmitter}
 */
export class MockHttpRequestResponse extends EventEmitter {

    private mStatus: string;

    /**
     * Methods for request
     */

    /**
     * Simulate ending the request
     * @memberof RequestOrResponse
     */
    public end() {
        // simulate ending the request
    }

    public write(data: string) {
        // doing important stuff with input data here
    }

    /**
     * Methods for response
     */

    /**
     * Simulate some status code
     * @readonly
     * @memberof RequestOrResponse
     */
    get statusCode() {
        if (this.mStatus == null) {
            this.mStatus = "200";
        }
        return this.mStatus;
    }

    /**
     * Set a status code
     * @memberof MockHttpRequestResponse
     */
    set statusCode(status: string) {
        this.mStatus = status;
    }

    /**
     * Simulate response headers
     * @memberof RequestOrResponse
     */
    public headers: { [key: string]: any };
}
