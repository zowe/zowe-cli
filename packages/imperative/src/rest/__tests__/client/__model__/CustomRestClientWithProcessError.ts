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

import { RestClient } from "../../../src/client/RestClient";
import { IImperativeError } from "../../../../error";
import { JSONUtils } from "../../../../utilities";
import { AbstractSession } from "../../../src/session/AbstractSession";

export const EXPECTED_REST_ERROR: IImperativeError = {
    msg: "This is our custom error that we're throwing"
};

/**
 * Class to handle http(s) requests, build headers, collect data, report status codes, and header responses
 * and passes control to session object for maintaining connection information (tokens, checking for timeout, etc...)
 * @export
 * @class CustomRestClientWithProcessError
 * @extends {RestClient}
 */
export class CustomRestClientWithProcessError extends RestClient {

    /*
     * Fake
     */
    public static async getExpectJSON<T extends object>(session: AbstractSession, resource: string, headers?: any[]): Promise<T> {
        const data = await this.getExpectString(session, resource, headers);
        return JSONUtils.parse<T>(data, "The get request appeared to succeed, but the response was not in the expected format");
    }

    protected processError(original: IImperativeError): IImperativeError {
        return EXPECTED_REST_ERROR;
    }
}
