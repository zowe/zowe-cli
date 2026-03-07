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

import { inspect } from "util";
import { AbstractSession, Headers, ImperativeExpect, Logger, RestClientError } from "@zowe/imperative";
import { ChangePassword, IChangePasswordParms, IChangePasswordResponse, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { ZosmfConstants } from "./constants/Zosmf.constants";
import { ZosmfMessages } from "./constants/Zosmf.messages";
import { IZosmfChangePasswordResponse } from "./doc/IZosmfChangePasswordResponse";

/**
 * Class to handle changing a z/OS password or passphrase via z/OSMF.
 *
 * https://www.ibm.com/docs/en/zos/3.2.0?topic=services-change-user-password-passphrase
 * @export
 * @class ZosmfChangePassword
 */
export class ZosmfChangePassword {
    private static readonly CENSORED = "****";

    /* z/OSMF return/reason codes that may hide specific errors */
    private static readonly EXTRA_RET_CODE = 8;
    private static readonly EXTRA_REASON_CODE = 2;

    /**
     * Change the password or passphrase for a z/OS user ID via z/OSMF.
     * @param {AbstractSession} session
     * @param {IChangePasswordParms} parms
     * @returns {Promise<IChangePasswordResponse>}
     */
    public static async changePassword(
        session: AbstractSession,
        parms: IChangePasswordParms
    ): Promise<IChangePasswordResponse> {
        return ChangePassword.changePassword(session, parms, ZosmfChangePassword.zosmfChangeFunc);
    }

    private static async zosmfChangeFunc(
        session: AbstractSession,
        parms: IChangePasswordParms
    ): Promise<IChangePasswordResponse> {
        ZosmfChangePassword.log.trace("ZosmfChangePassword.zosmfChangeFunc()");
        ImperativeExpect.toNotBeNullOrUndefined(session, ZosmfMessages.missingSession.message);

        const userID = session.ISession.user;
        const oldPwd = session.ISession.password;

        ImperativeExpect.toNotBeNullOrUndefined(userID, "Session user must be defined");
        ImperativeExpect.toNotBeNullOrUndefined(oldPwd, "Session password must be defined");

        let zosmfResponse: IZosmfChangePasswordResponse;
        try {
            zosmfResponse = await ZosmfRestClient.putExpectJSON<IZosmfChangePasswordResponse>(
                session,
                ZosmfConstants.AUTHENTICATE_RESOURCE,
                [Headers.APPLICATION_JSON],
                { userID, oldPwd, newPwd: parms.newPassword }
            );
        } catch (err) {
            throw ZosmfChangePassword.sanitizeError(err, oldPwd, parms.newPassword);
        }

        return {
            success: zosmfResponse.returnCode === 0 && zosmfResponse.reasonCode === 0,
            data: {
                returnCode: zosmfResponse.returnCode,
                reasonCode: zosmfResponse.reasonCode,
                message: zosmfResponse.message
            }
        };
    }

    /**
     * Remove passwords from diagnostic fields so they are never shown to the user or written to logs.
     * @param err - The original error
     * @param passwords - Password strings to censor
     * @returns The sanitised error
     */
    private static sanitizeError(err: Error, ...passwords: string[]): Error {
        if (err instanceof RestClientError) {
            // Censor password values inside the payload object
            if (err.mDetails.payload != null && typeof err.mDetails.payload === "object") {
                for (const key of Object.keys(err.mDetails.payload)) {
                    if (typeof err.mDetails.payload[key] === "string") {
                        for (const pwd of passwords) {
                            if (err.mDetails.payload[key] === pwd) {
                                err.mDetails.payload[key] = this.CENSORED;
                            }
                        }
                    }
                }
            }

            // Censor the payload string that appears in additionalDetails
            if (err.mDetails.additionalDetails && err.mDetails.payload != null) {
                const censoredPayloadStr = inspect(err.mDetails.payload, { depth: null });
                err.mDetails.additionalDetails = err.mDetails.additionalDetails.replace(
                    /\nPayload: +.*/,
                    "\nPayload:           " + censoredPayloadStr
                );
            }

            // Append extra context when the generic 8/2 error is returned
            if (err.causeErrors) {
                try {
                    const errorResponse = JSON.parse(err.causeErrors);
                    if (
                        errorResponse.returnCode === this.EXTRA_RET_CODE &&
                        errorResponse.reasonCode === this.EXTRA_REASON_CODE
                    ) {
                        const extraDetails =
                            "\n\nNote: This generic failure message may also indicate:" +
                            "\n  - The user ID was revoked" +
                            "\n  - The user ID is not defined in RACF" +
                            "\n\nThe z/OSMF server setting 'Display error details when login fails' controls " +
                            "whether these specific errors are shown. Contact your system administrator if needed.";

                        const updatedDetails = { ...err.mDetails };
                        updatedDetails.msg += extraDetails;
                        return new RestClientError(updatedDetails);
                    }
                } catch (parseErr) {
                    this.log.warn(
                        "Unable to parse error response body for additional details. " +
                        "Original error will be returned without additional details.\n" +
                        "Parse error: %s\nError body: %s",
                        parseErr,
                        err.causeErrors
                    );
                }
            }
        }

        return err;
    }

    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
