/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { AbstractSession, ImperativeExpect, Logger, ImperativeError, TextUtils } from "@brightside/imperative";
import { posix } from "path";
import { ZosmfConstants } from "../constants/Zosmf.constants";
import { ZosmfMessages } from "../constants/Zosmf.messages";
import { ZosmfRestClient } from "../../../../rest/src/ZosmfRestClient";
import { IZosmfInfoResponse } from "../doc/IZosmfInfoResponse";
import { CheckStatusMessages } from "../../cli/constants/CheckStatus.messages";

/**
 * This class holds the helper functions that are used to gather zosmf information throgh the
 * z/OSMF APIs.
 */
export class CheckStatus {
    /**
     * Get z/OSMF information
     * @param {AbstractSession} session z/OSMF connection info.
     * @returns {promise<IZosmfInfoResponse>} A response contains information from API call.
     * @throws {ImperativeError} session must not be null or undefined. Any error threw by
     *                           the REST API call.
     */
    public static async getZosmfInfo(session: AbstractSession): Promise<IZosmfInfoResponse> {
        this.log.trace("getZosmfInfo called");
        const infoEndpoint = posix.join(ZosmfConstants.RESOURCE, ZosmfConstants.INFO);
        this.log.debug(`Endpoint: ${infoEndpoint}`);
        let error: ImperativeError;
        let response: IZosmfInfoResponse = {};
        let message: string;

        ImperativeExpect.toNotBeNullOrUndefined(session, ZosmfMessages.missingSession.message);

        try{
            response = await ZosmfRestClient.getExpectJSON(session, infoEndpoint);
        } catch (err) {
            this.log.error(err);

            error = err;
            if ("causeErrors" in error && "code" in error.causeErrors) {
                switch (error.causeErrors.code) {
                    case ZosmfConstants.ERROR_CODES.BAD_HOST_NAME:
                        message = ZosmfMessages.invalidHostName.message;
                        if (session.ISession != null && session.ISession.hostname != null) {
                            message += session.ISession.hostname;
                        }
                        message += ".";
                        error = new ImperativeError({
                            msg: message,
                            causeErrors: error.causeErrors
                        });
                        break;
                    case ZosmfConstants.ERROR_CODES.BAD_PORT:
                        message = ZosmfMessages.invalidPort.message;
                        if (session.ISession != null && session.ISession.port != null) {
                            message += session.ISession.port;
                        }
                        message += ".";
                        error = new ImperativeError({
                            msg: message,
                            causeErrors: error.causeErrors
                        });
                        break;
                    case ZosmfConstants.ERROR_CODES.SELF_SIGNED_CERT_IN_CHAIN:
                        error = new ImperativeError({
                            msg: TextUtils.formatMessage(ZosmfMessages.improperRejectUnauthorized.message, {
                                rejectUnauthorized: session.ISession.rejectUnauthorized
                            }),
                            causeErrors: error.causeErrors
                        });
                        break;
                    default:
                        break;
                }
            }
            throw error;
        }
        return response;
    }

    /**
     * Get Log
     * @returns {Logger} applicationLogger.
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
