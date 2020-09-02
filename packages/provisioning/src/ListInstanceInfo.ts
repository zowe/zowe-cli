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

import { ZosmfRestClient } from "../../rest";
import { AbstractSession } from "@zowe/imperative";
import { ProvisioningValidator } from "./ProvisioningValidator";
import { noInstanceId, nozOSMFVersion, ProvisioningConstants } from "./ProvisioningConstants";
import { IProvisionedInstance } from "./doc/zosmf/IProvisionedInstance";

/**
 * Get info about a provisioned instance.
 * @export
 * @class ListInstanceInfo
 */
export class ListInstanceInfo {

    /**
     * This operation retrieves a published software service instance from the registry instances.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     *                              The following value is valid: 1.0.
     * @param {string} instanceId - the id of the provisioned software service instance.
     * @returns {Promise<IProvisionedInstance>} z/OSMF response object, @see {IProvisionedInstance}
     * @memberof ListInstanceInfo
     */
    public static async listInstanceCommon(session: AbstractSession, zOSMFVersion: string, instanceId: string) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        ProvisioningValidator.validateNotEmptyString(instanceId, noInstanceId.message);
        let resourcesQuery: string = `${ProvisioningConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${ProvisioningConstants.INSTANCES_RESOURCE}/${instanceId}`;

        return ZosmfRestClient.getExpectJSON<IProvisionedInstance>(session, resourcesQuery);
    }
}
