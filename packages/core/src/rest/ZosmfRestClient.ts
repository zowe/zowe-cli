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

import {
    IImperativeError, Logger, RestClient,
    RestConstants, SessConstants
} from "@zowe/imperative";
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
     * Use the Zowe logger instead of the imperative logger
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
        if (headers == null) {
            headers = [ZosmfHeaders.X_CSRF_ZOSMF_HEADER];
        } else {
            headers.push(ZosmfHeaders.X_CSRF_ZOSMF_HEADER);
        }
        return headers;
    }

    /**
     * Process an error encountered in the rest client
     * @param {IImperativeError} original - the original error automatically built by the abstract rest client
     * @returns {IImperativeError} - the processed error with details added
     * @memberof ZosmfRestClient
     */
    protected processError(original: IImperativeError): IImperativeError {
        let causeErrorsJson;
        let causeErrorsString = "";
        if (original.causeErrors) {
            causeErrorsString = original.causeErrors;
        }
        try {
            // don't try to parse an empty string
            if (causeErrorsString !== "") {
                causeErrorsJson = JSON.parse(causeErrorsString);
                // if we didn't get an error trying to parse causeErrorsString, check if there is a stack
                // on the JSON error and delete it
                if (causeErrorsJson.stack != null) {
                    this.log.error("An error was encountered in z/OSMF with a stack." +
                        " Here is the full error before deleting the stack:\n%s", JSON.stringify(causeErrorsJson));
                    this.log.error("The stack has been deleted from the error before displaying the error to the user");
                    delete causeErrorsJson.stack; // remove the stack field
                    original.causeErrors = JSON.stringify(causeErrorsJson, null);
                }
            }
        } catch (e) {
            // if there's an error, the causeErrors text is not JSON
            this.log.debug("Encountered an error trying to parse causeErrors as JSON  - causeErrors is likely not JSON format");
        }

        const origMsgFor401 = original.msg;
        // extract properties from causeErrors and place them into 'msg' as user-focused messages
        if (causeErrorsJson?.details?.length > 0) {
            for (const detail of causeErrorsJson.details) {
                original.msg += "\n" + detail;
            }
        }
        if (causeErrorsJson?.messages?.length > 0) {
            for (const message of causeErrorsJson.messages) {
                original.msg += "\n" + message.messageContent;
            }
        }

        // add further clarification on authentication errors
        if (this.response && this.response.statusCode === RestConstants.HTTP_STATUS_401) {
            if (!original.causeErrors || Object.keys(original.causeErrors ).length === 0) {
                /* We have no causeErrors, so place the original msg we got for a 401
                 * into the 'response from service' part of our error.
                 */
                original.causeErrors = `{"Error": "${origMsgFor401}"}`;
            }
            original.msg  += "\nThis operation requires authentication.";

            if (this.session.ISession.type === SessConstants.AUTH_TYPE_BASIC) {
                original.msg += "\nUsername or password are not valid or expired.";
            } else if (this.session.ISession.type === SessConstants.AUTH_TYPE_TOKEN) {
                if (this.session.ISession.tokenType === SessConstants.TOKEN_TYPE_APIML && !this.session.ISession.basePath) {
                    original.msg += `\nToken type "${SessConstants.TOKEN_TYPE_APIML}" requires base path to be defined.\n` +
                        "You must either connect with username and password or provide a base path.";
                } else {
                    original.msg += "\nToken is not valid or expired.\n" +
                        "To obtain a new valid token, use the following command: `zowe config secure`\n" +
                        "For CLI usage, see `zowe config secure --help`";
                }
            // TODO: Add PFX support in the future
            } else if (this.session.ISession.type === SessConstants.AUTH_TYPE_CERT_PEM) {
                original.msg += "\nCertificate is not valid or expired.";
            }
        }

        return original;
    }
}
