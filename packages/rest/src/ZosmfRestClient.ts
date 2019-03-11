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

import { IImperativeError, Logger, RestClient, TextUtils } from "@zowe/imperative";
import { isNullOrUndefined } from "util";
import { ZosmfHeaders } from "./ZosmfHeaders";

/**
 * Wrapper for invoke z/OSMF API through the RestClient to perform common error
 * handling and checking and resolve promises according to generic types
 * @export
 * @class ZosmfRestClient
 * @extends {RestClient}
 */
export class ZosmfRestClient extends RestClient {


    /**
     * Use the Brightside logger instead of the imperative logger
     * @type {Logger}
     */
    public get log(): Logger {
        return Logger.getAppLogger();
    }

    /**
     * Append z/OSMF specific headers to the callers headers for cases
     * where a header is common to every request.
     * @param {any[] | undefined} headers - current header array
     * @memberof ZosmfRestClient
     */
    protected appendHeaders(headers: any[] | undefined): any[] {
        if (isNullOrUndefined(headers)) {
            return [ZosmfHeaders.X_CSRF_ZOSMF_HEADER];
        } else {
            headers.push(ZosmfHeaders.X_CSRF_ZOSMF_HEADER);
            return headers;
        }
    }

    /**
     * Process an error encountered in the rest client
     * @param {IImperativeError} original - the original error automatically built by the abstract rest client
     * @returns {IImperativeError} - the processed error with details added
     * @memberof ZosmfRestClient
     */
    protected processError(original: IImperativeError): IImperativeError {
        original.msg = "z/OSMF REST API Error:\n" + original.msg;
        let details = original.causeErrors;
        try {
            const json = JSON.parse(details);
            // if we didn't get an error trying to parse json, check if there is a stack
            // on the JSON error and delete it
            if (json.stack != null) {
                this.log.error("An error was encountered in z/OSMF with a stack." +
                    " Here is the full error before deleting the stack:\n%s", JSON.stringify(json));
                this.log.error("The stack has been deleted from the error before displaying the error to the user");
                delete json.stack; // remove the stack field
            }

            // if we didn't get an error, make the parsed details part of the error
            details = TextUtils.prettyJson(json, undefined, false);
        } catch (e) {
            // if there's an error, the causeErrors text is not json
            this.log.debug("Encountered an error trying to parse causeErrors as JSON  - causeErrors is likely not JSON format");
        }
        original.msg += "\n" + details; // add the data string which is the original error
        return original;
    }
}
