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

import { IMessageDefinition, apiErrorHeader } from "@zowe/imperative";

/**
 * Constants for provisioning related info.
 * @export
 * @class ProvisioningConstants
 */
export class ProvisioningConstants {

    /**
     * URI base for provisioning API.
     * @static
     * @type {string}
     * @memberof ProvisioningConstants
     */
    public static readonly RESOURCE: string = "/zosmf/provisioning/rest";

    /**
     * URI base for provisioned instances API.
     * @static
     * @type {string}
     * @memberof ProvisioningConstants
     */
    public static readonly INSTANCES_RESOURCE: string = "scr";

    /**
     * URI base for published templates API.
     * @static
     * @type {string}
     * @memberof ProvisioningConstants
     */
    public static readonly TEMPLATES_RESOURCES: string = "psc";

    /**
     * URI base for performed actions on a provisioned instance.
     * @static
     * @type {string}
     * @memberof ProvisioningConstants
     */
    public static readonly ACTIONS_RESOURCES: string = "actions";

    /**
     * URI base for provisioned instance variables.
     * @static
     * @type {string}
     * @memberof ProvisioningConstants
     */
    public static readonly VARIABLES_RESOURCE: string = "variables";

    /**
     * Parameter for filtering by type.
     * @static
     * @type {string}
     * @memberof ProvisioningConstants
     */
    public static readonly RESOURCE_TYPE: string = "type";

    /**
     * Parameter for filtering by external name.
     * @static
     * @type {string}
     * @memberof ProvisioningConstants
     */
    public static readonly RESOURCE_EXTERNAL_NAME: string = "external-name";

    /**
     * URI base for provisioning a published template.
     * @static
     * @type {string}
     * @memberof ProvisioningConstants
     */
    public static readonly RESOURCE_PROVISION_RUN: string = "run";

    /**
     * Version of the z/OSMF software services template service
     * @static
     * @type {string}
     * @memberof ProvisioningConstants
     */
    public static readonly ZOSMF_VERSION: string = "1.0";

}

/**
 * Error message that no session provided.
 * @static
 * @type {IMessageDefinition}
 * @memberof ProvisioningConstants
 */
export const noSessionProvisioning: IMessageDefinition = {
    message: apiErrorHeader.message + ` No session was supplied.`
};

/**
 * Error message that no template name parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof ProvisioningConstants
 */
export const noTemplateName: IMessageDefinition = {
    message: apiErrorHeader.message + ` No template name parameter was supplied.`
};

/**
 * No account number was provided error message.
 * @static
 * @type {IMessageDefinition}
 * @memberof ProvisioningConstants
 */
export const noAccountInfo: IMessageDefinition = {
    message: apiErrorHeader.message + ` No account number was supplied.`
};

/**
 * Error message that no instance-id parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof ProvisioningConstants
 */
export const noInstanceId: IMessageDefinition = {
    message: apiErrorHeader.message + ` No instance-id parameter was supplied.`
};

/**
 * Error message that no template name parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof ProvisioningConstants
 */
export const noActionName: IMessageDefinition = {
    message: apiErrorHeader.message + ` No action name parameter was supplied.`
};
