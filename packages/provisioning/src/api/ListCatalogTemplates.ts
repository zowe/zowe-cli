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

import { ZosmfRestClient } from "../../../rest";
import { AbstractSession } from "@zowe/imperative";
import { ProvisioningValidator } from "./ProvisioningValidator";
import { nozOSMFVersion, ProvisioningConstants } from "./ProvisioningConstants";
import { IPublishedTemplates } from "./doc/zosmf/IPublishedTemplates";


/**
 * Get info about all published templates.
 * @export
 * @class ListCatalogTemplates
 */
export class ListCatalogTemplates {

    /**
     * This operation returns the catalog of published software service templates.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     *                              The following value is valid: 1.0.
     * @returns {Promise<IPublishedTemplates>} z/OSMF response object, @see {IPublishedTemplates}
     * @memberof ListCatalogTemplates
     */
    public static async listCatalogCommon(session: AbstractSession, zOSMFVersion: string) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        let listTemplatesResources: string = `${ProvisioningConstants.RESOURCE}/${zOSMFVersion}`;
        listTemplatesResources += `/${ProvisioningConstants.TEMPLATES_RESOURCES}/`;
        return ZosmfRestClient.getExpectJSON<IPublishedTemplates>(session, listTemplatesResources);
    }
}
