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
import { ZosmfRestClient } from "@zowe/rest-for-zowe-sdk";
import { ProvisioningValidator } from "./ProvisioningValidator";
import { noTemplateName, nozOSMFVersion, ProvisioningConstants } from "./ProvisioningConstants";
import { IPublishedTemplateInfo } from "./doc/zosmf/IPublishedTemplateInfo";

/**
 * Get info about a template.
 * @export
 * @class ListTemplateInfo
 */
export class ListTemplateInfo {

    /**
     * This operation retrieves a published software service template from the catalog.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     *                              The following value is valid: 1.0.
     * @param {string} templateName - the name of published software service template in the catalog.
     * @returns {Promise<IPublishedTemplateInfo>} z/OSMF response object, @see {IPublishedTemplateInfo}
     * @memberof ListTemplateInfo
     */
    public static async listTemplateCommon(session: AbstractSession, zOSMFVersion: string, templateName: string) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        ProvisioningValidator.validateNotEmptyString(templateName, noTemplateName.message);
        const listTemplateInfoResources = this.getResourcesQuery(zOSMFVersion, templateName);

        return ZosmfRestClient.getExpectJSON<IPublishedTemplateInfo>(session, listTemplateInfoResources);
    }

    /**
     * Builds a resources query from passed parameters which is needed for z/OSMF api URI.
     * @param {string} zOSMFVersion is the URI path variable that identifies the version of the z/OSMF software services template service.
     *                              The following value is valid: 1.0.
     * @param {string} templateName is the name of published software service template in the catalog.
     * @returns {string} URI for z/OSMF REST call
     * @memberof ListTemplateInfo
     */
    public static getResourcesQuery(zOSMFVersion: string, templateName: string): string {
        let resourcesQuery: string = `${ProvisioningConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${ProvisioningConstants.TEMPLATES_RESOURCES}/${templateName}`;
        return resourcesQuery;
    }
}
