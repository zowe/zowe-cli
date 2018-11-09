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

import { IExplanationMap } from "@brightside/imperative";
import { explainTemplateRegistryInfoResponse, ITemplateRegistryInfo } from "./ITemplateRegistryInfo";
import { explainTemplateWorkflowInfoResponse, ITemplateWorkflowInfo } from "./ITemplateWorkflowInfo";

/**
 * Interface for provisioning the published template of the z/OSMF API response.
 * @export
 * @interface IProvisionTemplateResponse
 */
export interface IProvisionTemplateResponse {
    /**
     * Nickname of the system that the service is provisioned on.
     * @type {string}
     * @memberof IProvisionTemplateResponse
     */
    "system-nickname": string;

    /**
     * Object mapping that matches the response body returned from a registry create action.
     * @type {ITemplateRegistryInfo}, @see {ITemplateRegistryInfo}
     * @memberof IProvisionTemplateResponse
     */
    "registry-info": ITemplateRegistryInfo;

    /**
     * Object mapping that matches the response body returned from the workflow create action.
     * @type {ITemplateWorkflowInfo}, @see {ITemplateWorkflowInfo}
     * @memberof IProvisionTemplateResponse
     */
    "workflow-info": ITemplateWorkflowInfo;
}

/**
 * Main explanation map object for summary output.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IProvisionTemplateResponse
 */
export const explainProvisionTemplateResponse: IExplanationMap = {
    "system-nickname": "System Nickname",
    "explainedParentKey": null,
    "ignoredKeys": null,
    "registry-info": explainTemplateRegistryInfoResponse,
    "workflow-info": explainTemplateWorkflowInfoResponse
};
