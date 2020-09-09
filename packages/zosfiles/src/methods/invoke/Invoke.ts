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

import * as fs from "fs";
import { AbstractSession, Headers, ImperativeError, ImperativeExpect, Logger } from "@zowe/imperative";
import { posix } from "path";
import * as util from "util";

import { IHeaderContent, ZosmfRestClient, ZosmfHeaders, getErrorContext } from "@zowe/core-for-zowe-sdk";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IZosFilesOptions } from "../../doc/IZosFilesOptions";

/**
 * This class holds helper functions that are used to execute AMS control statements through the z/OS MF APIs
 */
export class Invoke {
    /**
     * Send the AMS request to z/OS MF
     *
     * @param {AbstractSession}   session           - z/OS MF connection info
     * @param {string | string[]} controlStatements - contains the statements or the file path to them
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} controlStatements must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_PUTIDCAMSAccessMethodsServices.htm
     */
    public static async ams(session: AbstractSession, controlStatements: string | string[], options?: IZosFilesOptions): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(controlStatements, ZosFilesMessages.missingStatements.message);
        ImperativeExpect.toNotBeEqual(controlStatements.length, 0, ZosFilesMessages.missingStatements.message);

        let statements;

        if (typeof controlStatements === "string") {
            // We got a file path
            try {
                statements = fs.readFileSync(controlStatements).toString().toUpperCase().split(/\r?\n/);
            } catch (error) {
                Logger.getAppLogger().error(error);
                throw error;
            }
        } else {
            statements = controlStatements.map((stmt) => stmt.toUpperCase());
        }

        const longStmtIndex = statements.findIndex((stmt: string) => stmt.length > ZosFilesConstants.MAX_AMS_LINE);
        if (longStmtIndex >= 0) {
            throw new ImperativeError({
                msg: util.format(
                    ZosFilesMessages.longAmsStatement.message,
                    longStmtIndex + 1,
                    ZosFilesConstants.MAX_AMS_LINE,
                    getErrorContext(statements, longStmtIndex))
            });
        }

        try {
            // Format the endpoint to send the request to
            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_AMS);

            Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

            // The request payload
            const reqPayload = {input: statements};

            // The request headers
            const reqHeaders: IHeaderContent[] = [
                Headers.APPLICATION_JSON,
                {
                    [Headers.CONTENT_LENGTH]: JSON.stringify(reqPayload).length.toString()
                }
            ];

            if (options && options.responseTimeout != null) {
                reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            }

            const response = await ZosmfRestClient.putExpectJSON(session, endpoint, reqHeaders, reqPayload);
            return {
                success: true,
                commandResponse: ZosFilesMessages.amsCommandExecutedSuccessfully.message,
                apiResponse: response
            };
        } catch (error) {
            Logger.getAppLogger().error(error);

            throw error;
        }
    }
}
