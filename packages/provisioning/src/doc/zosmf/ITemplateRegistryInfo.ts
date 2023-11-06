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

import { IExplanationMap } from "@zowe/core-for-zowe-sdk";

/**
 * Interface for the response body returned from a registry create action.
 * @export
 * @interface ITemplateRegistryInfo
 */
export interface ITemplateRegistryInfo {
    /**
     * Name of the object.
     * @type {string}
     * @memberof ITemplateRegistryInfo
     */
    "object-name": string;

    /**
     * ID of the object.
     * @type {string}
     * @memberof ITemplateRegistryInfo
     */
    "object-id": string;

    /**
     * URI of the object.
     * @type {string}
     * @memberof ITemplateRegistryInfo
     */
    "object-uri": string;

    /**
     * External name of the software services instance.
     * @type {string}
     * @memberof ITemplateRegistryInfo
     */
    "external-name": string;

    /**
     * The name of the system entry in the system entry table of the software.
     * @type {string}
     * @memberof ITemplateRegistryInfo
     */
    "system-nickname": string;

}


/**
 * Main explanation map object for summary output.
 * @type {IExplanationMap}
 * @memberof ITemplateRegistryInfo
 */
export const explainTemplateRegistryInfoResponse: IExplanationMap = {
    "explainedParentKey": "Registry Info",
    "ignoredKeys": null,
    "external-name": "Name",
    "object-id": "Id"
};
