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

import { ZosmfRestClient, nozOSMFVersion } from "@zowe/core-for-zowe-sdk";
import { AbstractSession, Headers } from "@zowe/imperative";
import { ProvisioningValidator } from "./ProvisioningValidator";
import { noActionName, noInstanceId, ProvisioningConstants } from "./ProvisioningConstants";
import { IPerformActionResponse } from "./doc/zosmf/IPerformActionResponse";

/**
 * Perform an action on published software service template.
 * @export
 * @class PerformAction
 */
export class PerformAction {

    /**
     * Performs an action against a provisioned software service instance.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     *                              The following value is valid: 1.0.
     * @param {string} instanceId - the object-id of provisioned instance in the registry.
     * @param {string} actionName - name of the action to perform.
     * @returns {Promise<IPerformActionResponse>} z/OSMF response object, @see {IPerformActionResponse}
     * @memberof PerformAction
     */
    public static async doProvisioningActionCommon(session: AbstractSession, zOSMFVersion: string, instanceId: string, actionName: string) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        ProvisioningValidator.validateNotEmptyString(instanceId, noInstanceId.message);
        ProvisioningValidator.validateNotEmptyString(actionName, noActionName.message);
        const resourcesQuery: string = this.getResourcesQuery(zOSMFVersion, instanceId, actionName);

        return ZosmfRestClient.postExpectJSON<IPerformActionResponse>(session, resourcesQuery, [Headers.APPLICATION_JSON]);
    }

    /**
     * Builds a resources query from passed parameters which is needed for z/OSMF api URI.
     * @param {string} zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     *                              The following value is valid: 1.0.
     * @param {string} instanceId - the object-id of provisioned instance in the registry.
     * @param {string} actionName - name of the action to perform.
     * @returns {string} URI for z/OSMF REST call
     * @memberof PerformAction
     */
    public static getResourcesQuery(zOSMFVersion: string, instanceId: string, actionName: string): string {
        let resourcesQuery = `${ProvisioningConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${ProvisioningConstants.INSTANCES_RESOURCE}/${instanceId}/`;
        resourcesQuery += `${ProvisioningConstants.ACTIONS_RESOURCES}/${actionName}`;
        return resourcesQuery;
    }
}
