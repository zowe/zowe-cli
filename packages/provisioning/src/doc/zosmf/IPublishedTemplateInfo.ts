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
import { explainPromptVariableFull, explainPromptVariableSummary, IPromptVariable } from "./IPromptVariable";


/**
 * The ListTemplateInfo z/OSMF API response.
 * @export
 * @interface IPublishedTemplateInfo
 */
export interface IPublishedTemplateInfo {
    /**
     * Name of the template.
     * @type {string}
     * @memberof IPublishedTemplateInfo
     */
    name: string;

    /**
     * Version of the template.
     * @type {string}
     * @memberof IPublishedTemplateInfo
     */
    version: string;

    /**
     * Template owner ID.
     * @type {string}
     * @memberof IPublishedTemplateInfo
     */
    owner: string;

    /**
     * Status of the template.
     * @type {string}
     * @memberof IPublishedTemplateInfo
     */
    state: string;

    /**
     * Description of the template.
     * @type {string}
     * @memberof IPublishedTemplateInfo
     */
    description: string;

    /**
     * Generated name for a template.
     * @type {string}
     * @memberof IPublishedTemplateInfo
     */
    "generated-name": string;

    /**
     * The ID that identifies a template.
     * @type {string}
     * @memberof IPublishedTemplateInfo
     */
    "object-id": string;

    /**
     * The domain the template is associated with.
     * @type {string}
     * @memberof IPublishedTemplateInfo
     */
    "domain-name": string;

    /**
     * Name of the software that is being provisioned.
     * @type {string}
     * @memberof IPublishedTemplateInfo
     */
    "software-name": string;

    /**
     * Array the of prompt variables of the template.
     * @type {IPromptVariable}
     * @memberof IPublishedTemplateInfo
     */
    "prompt-variables": IPromptVariable[];
}


/**
 * Explained keys for summary
 * @memberof IPublishedTemplateInfo
 */
const prettySummary: {
    [key: string]: string;
} = {
    "name": "Template Name",
    "version": "Version",
    "owner": "Owner",
    "state": "State",
    "description": "Description",
    "generated-name": "Generated Name",
    "object-id": "Object Id"
};

/**
 * Explained keys for all-info
 * @memberof IPublishedTemplateInfo
 */
const prettyFull: {
    [key: string]: string;
} = {
    ...prettySummary,
    "domain-name": "Domain Name",
    "software-name": "Software Name"
};

/**
 * Main explanation map object for summary output
 * @type {IExplanationMap}
 * @memberof IPublishedTemplateInfo
 */
export const explainPublishedTemplateInfoSummary: IExplanationMap = {
    ...prettySummary,
    "prompt-variables": explainPromptVariableSummary,
    "ignoredKeys": null,
    "explainedParentKey": null
};

/**
 * Main explanation map object for full output
 * @type {IExplanationMap}
 * @memberof IPublishedTemplateInfo
 */
export const explainPublishedTemplateInfoFull: IExplanationMap = {
    ...prettyFull,
    "prompt-variables": explainPromptVariableFull,
    "ignoredKeys": null,
    "explainedParentKey": null
};
