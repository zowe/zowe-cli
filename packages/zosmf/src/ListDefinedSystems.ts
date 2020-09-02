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

import { AbstractSession, ImperativeExpect } from "@zowe/imperative";
import { posix } from "path";
import { ZosmfConstants } from "./constants/Zosmf.constants";
import { ZosmfMessages } from "./constants/Zosmf.messages";
import { ZosmfRestClient } from "@zowe/rest-for-zowe-sdk";
import { IZosmfListDefinedSystemsResponse } from "./doc/IZosmfListDefinedSystemsResponse";

/**
 * This class is used to list the systems defined to z/OSMF throgh the
 * z/OSMF APIs.
 */
export class ListDefinedSystems {
    /**
     * List systems defined to z/OSMF
     * @param {AbstractSession} session z/OSMF connection info.
     * @returns {promise<IZosmfListDefinedSystemsResponse>} A response contains information from API call.
     * @throws {ImperativeError} session must not be null or undefined. Any error threw by
     *                           the REST API call.
     */
    public static async listDefinedSystems(session: AbstractSession): Promise<IZosmfListDefinedSystemsResponse> {
        const endpoint = posix.join(ZosmfConstants.RESOURCE, ZosmfConstants.TOPOLOGY, ZosmfConstants.SYSTEMS);
        ImperativeExpect.toNotBeNullOrUndefined(session, ZosmfMessages.missingSession.message);
        return ZosmfRestClient.getExpectJSON<IZosmfListDefinedSystemsResponse>(session, endpoint);
    }
}
