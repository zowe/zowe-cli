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
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { ZosmfConstants } from "./constants/Zosmf.constants";
import { IChangePassword } from "./doc/IChangePassword";

/**
 * Class to handle changing a z/OS password or passphrase.
 * @export
 * @class ChangePassword
 */
export class ChangePassword {
    private static readonly CENSORED = "****";
    private static readonly EXTRA_RET_CODE = 8;
    private static readonly EXTRA_REASON_CODE = 2;

    /**
     * Change the password or passphrase for a z/OS user ID via z/OSMF.
     *
     * Uses the z/OSMF `PUT /zosmf/services/authenticate` endpoint.
     *
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} userID - The z/OS user ID whose password is being changed
     * @param {string} oldPwd - The current (old) password or passphrase
     * @param {string} newPwd - The new password or passphrase
     * @returns {Promise<IChangePassword>} - The response from z/OSMF
     * @memberof ChangePassword
     */
    public static async zosmfChangePassword(
        session: AbstractSession,
        userID: string,
        oldPwd: string,
        newPwd: string
    ): Promise<IChangePassword> {
        this.log.trace("ChangePassword.zosmfChangePassword()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        ImperativeExpect.toNotBeNullOrUndefined(userID, "User ID must be defined");
        ImperativeExpect.toNotBeNullOrUndefined(oldPwd, "Old password must be defined");
        ImperativeExpect.toNotBeNullOrUndefined(newPwd, "New password must be defined");

        try {
            return await ZosmfRestClient.putExpectJSON<IChangePassword>(
                session,
                ZosmfConstants.AUTHENTICATE_RESOURCE,
                [Headers.APPLICATION_JSON],
                { userID, oldPwd, newPwd }
            );
        } catch (err) {
            throw this.sanitizeError(err, oldPwd, newPwd);
        }
    }

    /**
     * Remove passwords from a RestClientError's diagnostic fields so they
     * are never shown to the user or written to logs.
     * Also addresses the note in: https://www.ibm.com/docs/en/zos/2.4.0?topic=services-change-user-password-passphrase#d208821e335
     * About return code 8, reason code 2 being a generic failure that may indicate other specific errors if a server side setting is disabled.
     * @param err - The original error
     * @param passwords - Password strings to censor
     * @returns The sanitized error
     */
    private static sanitizeError(err: unknown, ...passwords: string[]): unknown {
        if (err instanceof RestClientError) {
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
            // Payload:           { userID: 'IBMUSER', oldPwd: '****', newPwd: '****' }
            if (err.mDetails.additionalDetails && err.mDetails.payload != null) {
                const censoredPayloadStr = inspect(err.mDetails.payload, { depth: null });
                err.mDetails.additionalDetails = err.mDetails.additionalDetails.replace(
                    /\nPayload: +.*/,
                    "\nPayload:           " + censoredPayloadStr
                );
            }
            if (err.causeErrors) {
                try {
                    const errorResponse = JSON.parse(err.causeErrors);
                    if (errorResponse.returnCode === this.EXTRA_RET_CODE && errorResponse.reasonCode === this.EXTRA_REASON_CODE) {
                        const extraDetails = "\n\nNote: This generic failure message may also indicate:" +
                            "\n  - The user ID was revoked" +
                            "\n  - The user ID is not defined in RACF" +
                            "\n\nThe z/OSMF server setting 'Display error details when login fails' controls " +
                            "whether these specific errors are shown. Contact your system administrator if needed.";
                        const updatedDetails = { ...err.mDetails };
                        updatedDetails.msg += extraDetails;
                        return new RestClientError(updatedDetails);
                    }
                } catch (parseErr) {
                    this.log.warn("Unable to parse error response body for additional details. " +
                        "Original error will be returned without additional details.\n" +
                        "Parse error: %s\nError body: %s", parseErr, err.causeErrors);
                }
            }
        }
        return err;
    }

    /**
     * Get Log
     * @returns {Logger} applicationLogger.
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
