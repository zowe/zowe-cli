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

import { AbstractSession, Headers } from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/rest-for-zowe-sdk";
import { noInstanceId, nozOSMFVersion, ProvisioningConstants } from "./ProvisioningConstants";
import { ProvisioningValidator } from "./ProvisioningValidator";

/**
 * Delete deprovisioned instances.
 * @export
 * @class DeleteInstance
 */
export class DeleteInstance {

    /**
     * Performs the delete action against a provisioned software service instance.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     *                              The following value is valid: 1.0.
     * @param {string} instanceId - the object-id of provisioned instance in the registry.
     * @returns {Promise<{}>} z/OSMF response is empty object.
     * @memberof DeleteInstance
     */
    public static deleteDeprovisionedInstance(session: AbstractSession, zOSMFVersion: string, instanceId: string) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        ProvisioningValidator.validateNotEmptyString(instanceId, noInstanceId.message);
        let resourcesQuery: string = `${ProvisioningConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${ProvisioningConstants.INSTANCES_RESOURCE}/${instanceId}`;

        return ZosmfRestClient.deleteExpectString(session, resourcesQuery, [Headers.APPLICATION_JSON]);
    }
}
