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

import { AbstractSession } from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { TsoValidator } from "./TsoValidator";
import { noAccountNumber, TsoConstants } from "./TsoConstants";
import { ITsoAppCommunicationParms } from "./doc/input/ITsoAppCommunicationParms";

/**
 * Send message to TSO App running at an address space
 * @export
 * @class RecieveTsoApp
 */
export class ReceiveTsoApp {
    /**
     * Start TSO application at address space with provided parameters.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}  accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @param {IStartTsoParms} params - optional object with required parameters, @see {IStartTsoParms}
     * @returns {Promise<IStartASAppResponse>} command response on resolve, @see {IStartASAppResponse}
     * @memberof StartTso
     */
    public static async receive(
        session: AbstractSession,
        accountNumber: string,
        params: ITsoAppCommunicationParms,
    ): Promise<string> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(
            accountNumber,
            noAccountNumber.message
        );

        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
        const apiResponse =
            await ZosmfRestClient.getExpectString(
                session,
                endpoint,
            );

        return apiResponse;
    }
}
