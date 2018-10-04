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
import { AbstractSession, Headers } from "@brightside/imperative";
import { ProvisioningValidator } from "./ProvisioningValidator";
import { noAccountInfo, noTemplateName, nozOSMFVersion, ProvisioningConstants } from "./ProvisioningConstants";
import { IProvisionTemplateResponse } from "./doc/zosmf/IProvisionTemplateResponse";
import { IProvisionOptionals } from "./doc/input/IProvisionOptionals";

/**
 * Provision a published software service template.
 * @export
 * @class ProvisionPublishedTemplate
 */
export class ProvisionPublishedTemplate {


    /**
     * Provision a published software service template only with account number parameter.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     *                              The following value is valid: 1.0.
     * @param {string} templateName - the name of published software service template.
     * @param {string} account - account information to use in the JCL JOB statement.
     * @returns {Promise<IProvisionTemplateResponse>} z/OSMF response object, @see {IProvisionTemplateResponse}
     * @memberof ProvisionPublishedTemplate
     */
    public static async provisionTemplateCommon(session: AbstractSession, zOSMFVersion: string,
                                                templateName: string, account: string) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        ProvisioningValidator.validateNotEmptyString(templateName, noTemplateName.message);
        ProvisioningValidator.validateNotEmptyString(account, noAccountInfo.message);

        let resourcesQuery: string = `${ProvisioningConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${ProvisioningConstants.TEMPLATES_RESOURCES}/${templateName}/`;
        resourcesQuery += `${ProvisioningConstants.ACTIONS_RESOURCES}/${ProvisioningConstants.RESOURCE_PROVISION_RUN}`;

        return ZosmfRestClient.postExpectJSON<IProvisionTemplateResponse>(session, resourcesQuery,
            [Headers.APPLICATION_JSON], {"account-info": account});

    }

    /**
     * Provision a published software service template, with optional parameters if passed.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     *                              The following value is valid: 1.0.
     * @param {string} templateName - the name of published software service template.
     * @param {IProvisionOptionals} optionalParms - optional parameters for z/OSMF rest call, @see {IProvisionOptionals}.
     * @returns {Promise<IProvisionTemplateResponse>} z/OSMF response object, @see {IProvisionTemplateResponse}
     * @memberof ProvisionPublishedTemplate
     */
    public static async provisionTemplate(session: AbstractSession, zOSMFVersion: string,
                                          templateName: string, optionalParms?: IProvisionOptionals) {
        ProvisioningValidator.validateSession(session);
        ProvisioningValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        ProvisioningValidator.validateNotEmptyString(templateName, noTemplateName.message);

        let resourcesQuery: string = `${ProvisioningConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${ProvisioningConstants.TEMPLATES_RESOURCES}/${templateName}/`;
        resourcesQuery += `${ProvisioningConstants.ACTIONS_RESOURCES}/${ProvisioningConstants.RESOURCE_PROVISION_RUN}`;

        if (optionalParms) {
            return ZosmfRestClient.postExpectJSON<IProvisionTemplateResponse>(session, resourcesQuery, [Headers.APPLICATION_JSON], optionalParms);
        } else {
            return ZosmfRestClient.postExpectJSON<IProvisionTemplateResponse>(session, resourcesQuery, [Headers.APPLICATION_JSON]);
        }
    }

}
