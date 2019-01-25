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

import { ZosmfRestClient } from "../../../rest";
import { AbstractSession } from "@brightside/imperative";
import { ProvisioningValidator } from "./ProvisioningValidator";
import { noInstanceId, nozOSMFVersion, ProvisioningConstants } from "./ProvisioningConstants";
import { IProvisionedInstanceVariables } from "./doc/zosmf/IProvisionedInstanceVariables";

/**
 * Get variables of the provisioned instance.
 * @export
 * @class ListInstanceVariables
 */
export class ListInstanceVariables {

    /**
     * This operation returns variables of the provisioned instance.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} instanceId - unique id of the provisioned instance .
     * @returns {Promise<IProvisionedInstanceVariable>} z/OSMF response object, @see {IProvisionedInstanceVariable}
     * @memberof ListInstanceVariables
     */
    public static async listVariablesCommon(session: AbstractSession, zOSMFVersion: string, instanceId: string) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        ProvisioningValidator.validateNotEmptyString(instanceId, noInstanceId.message);
        const resourcesQuery = this.getResourcesQuery(zOSMFVersion, instanceId);

        return ZosmfRestClient.getExpectJSON<IProvisionedInstanceVariables>(session, resourcesQuery);
    }

    /**
     * Builds a resources query from passed parameters which is needed for z/OSMF api URI.
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} instanceId - unique id of the provisioned instance .
     * @returns {string} URI path for the REST call.
     * @memberof ListInstanceVariables
     */
    public static getResourcesQuery(zOSMFVersion: string, instanceId: string) {
        let resourcesQuery = `${ProvisioningConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${ProvisioningConstants.INSTANCES_RESOURCE}/${instanceId}/`;
        resourcesQuery += `${ProvisioningConstants.VARIABLES_RESOURCE}`;
        return resourcesQuery;
    }
}
