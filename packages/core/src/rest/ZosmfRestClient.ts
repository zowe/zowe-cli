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

import { Logger } from "../logger/Logger";
import { RestClient, RestConstants } from "./client";
import { SessConstants } from "./session";
import { NextVerFeatures } from "../utils/NextVerFeatures";
import { TextUtils } from "../utils/TextUtils";
import { IImperativeError } from "../error/doc/IImperativeError";
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
        // TODO:V3_ERR_FORMAT - Remove block in V3
        if (!NextVerFeatures.useV3ErrFormat()) {
            original.msg = "z/OSMF REST API Error:\n" + original.msg;
        }

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
                }

                // if we didn't get an error, make the parsed causeErrorsString part of the error
                causeErrorsString = TextUtils.prettyJson(causeErrorsJson, undefined, false);
            }
        } catch (e) {
            // if there's an error, the causeErrors text is not JSON
            this.log.debug("Encountered an error trying to parse causeErrors as JSON  - causeErrors is likely not JSON format");
        }

        const origMsgFor401 = original.msg;
        // TODO:V3_ERR_FORMAT - Don't test for env variable in V3
        if (NextVerFeatures.useV3ErrFormat()) {
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
        } else { // TODO:V3_ERR_FORMAT - Remove in V3
            original.msg += "\n" + causeErrorsString; // add the data string which is the original error
        }

        // add further clarification on authentication errors
        if (this.response && this.response.statusCode === RestConstants.HTTP_STATUS_401) {
            // TODO:V3_ERR_FORMAT - Don't test for env variable in V3
            if (NextVerFeatures.useV3ErrFormat()) {
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
            } else { // TODO:V3_ERR_FORMAT - Remove in V3
                original.msg = "This operation requires authentication.\n\n" + original.msg +
                    "\nHost:      " + this.session.ISession.hostname +
                    "\nPort:      " + this.session.ISession.port +
                    "\nBase Path: " + this.session.ISession.basePath +
                    "\nResource:  " + this.mResource +
                    "\nRequest:   " + this.mRequest +
                    "\nHeaders:   " + JSON.stringify(this.mReqHeaders) +
                    "\nPayload:   " + this.mRequest +
                    "\n"
                ;
                if (this.session.ISession.type === SessConstants.AUTH_TYPE_BASIC) {
                    original.additionalDetails = "Username or password are not valid or expired.\n\n";
                } else if (this.session.ISession.type === SessConstants.AUTH_TYPE_TOKEN && this.session.ISession.tokenValue != null) {
                    if (this.session.ISession.tokenType === SessConstants.TOKEN_TYPE_APIML && !this.session.ISession.basePath) {
                        original.additionalDetails = `Token type "${SessConstants.TOKEN_TYPE_APIML}" requires base path to be defined.\n\n` +
                            "You must either connect with username and password or provide a base path.";
                    } else {
                        original.additionalDetails = "Token is not valid or expired.\n" +
                        "To obtain a new valid token, use the following command: `zowe config secure`\n" +
                        "For CLI usage, see `zowe config secure --help`";
                    }
                // TODO: Add PFX support in the future
                } else if (this.session.ISession.type === SessConstants.AUTH_TYPE_CERT_PEM) {
                    original.additionalDetails = "Certificate is not valid or expired.\n\n";
                }
            }
        }

        return original;
    }
}
