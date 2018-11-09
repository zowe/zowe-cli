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

import { isNullOrUndefined } from "util";
import { ZosmfRestClient } from "../../../rest";
import { AbstractSession } from "@brightside/imperative";
import { ProvisioningValidator } from "./ProvisioningValidator";
import { nozOSMFVersion, ProvisioningConstants } from "./ProvisioningConstants";
import { IProvisionedInstances } from "./doc/zosmf/IProvisionedInstances";


/**
 * Get info about all provisioned instances.
 * @export
 * @class ListRegistryInstances
 */
export class ListRegistryInstances {

    /**
     * This operation returns registry of provisioned instances.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} filteredQuery - URI path with filters for listing filtered registry instances.
     * @returns {Promise<IProvisionedInstances>} z/OSMF response object, @see {IProvisionedInstances}
     * @memberof ListRegistryInstances
     */
    public static async listRegistryCommon(session: AbstractSession, zOSMFVersion: string, filteredQuery?: string) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        const query = filteredQuery ? filteredQuery : this.getResourcesQuery(zOSMFVersion);
        return ZosmfRestClient.getExpectJSON<IProvisionedInstances>(session, query);
    }

    /**
     * This operation returns registry of provisioned instances filtered by type and external name.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} type - system type of the instance.
     * @param {string} externalName - regular expression, specifies the external name of the instance.
     * @returns {Promise<IProvisionedInstances>} z/OSMF response object, @see {IProvisionedInstances}
     * @memberof ListRegistryInstances
     */
    public static async listFilteredRegistry(session: AbstractSession, zOSMFVersion: string, type: string, externalName: string) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        const query = this.getResourcesQuery(zOSMFVersion, type, externalName);
        return this.listRegistryCommon(session, zOSMFVersion, query);
    }

    /**
     * Builds URI path from provided parameters.
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} type - system type of the instance.
     * @param {string} externalName - regular expression, specifies the external name of the instance.
     * @returns {string} URI path for the REST call.
     * @memberof ListRegistryInstances
     */
    public static getResourcesQuery(zOSMFVersion: string, type?: string, externalName?: string) {
        let query = `${ProvisioningConstants.RESOURCE}/${zOSMFVersion}/${ProvisioningConstants.INSTANCES_RESOURCE}`;
        if (!isNullOrUndefined(type)) {
            query += `?${ProvisioningConstants.RESOURCE_TYPE}=${type}`;
        }
        if (!isNullOrUndefined(externalName)) {
            query += type ? "&" : "?";
            query += `${ProvisioningConstants.RESOURCE_EXTERNAL_NAME}=${externalName}`;
        }
        return query;
    }
}
