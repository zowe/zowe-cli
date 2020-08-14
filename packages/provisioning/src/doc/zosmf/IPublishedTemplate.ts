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

import { IExplanationMap } from "@zowe/imperative";

/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IPublishedTemplate
 */
export interface IPublishedTemplate {
    /**
     * Name of a template.
     * @type {string}
     * @memberof IPublishedTemplate
     */
    name: string;

    /**
     * Version of a template.
     * @type {string}
     * @memberof IPublishedTemplate
     */
    version: string;

    /**
     * Template owner ID.
     * @type {string}
     * @memberof IPublishedTemplate
     */
    owner: string;

    /**
     * Status of a template.
     * @type {string}
     * @memberof IPublishedTemplate
     */
    state: string;

    /**
     * Description of a template.
     * @type {string}
     * @memberof IPublishedTemplate
     */
    description: string;

    /**
     * Generated name for a template.
     * @type {string}
     * @memberof IPublishedTemplate
     */
    "generated-name": string;

    /**
     * The ID that identifies a template.
     * @type {string}
     * @memberof IPublishedTemplate
     */
    "object-id": string;

    /**
     * The domain the template is associated with.
     * @type {string}
     * @memberof IPublishedTemplate
     */
    "domain-name": string;

    /**
     * Name of the software that is being provisioned.
     * @type {string}
     * @memberof IPublishedTemplate
     */
    "software-name": string;
}


/**
 * Local explanation map for summary
 * @memberof IPublishedTemplate
 */
const prettySummary: {
    [key: string]: string;
} = {
    "name": "Name",
    "version": "Version",
    "owner": "Owner",
    "state": "State",
    "description": "Description",
    "generated-name": "Generated Name",
    "object-id": "Object Id"
};

/**
 * Local explanation map for full
 * @memberof IPublishedTemplate
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
 * @memberof IPublishedTemplate
 */
export const explainPublishedTemplateSummary: IExplanationMap = {
    ...prettySummary,
    explainedParentKey: "Published Templates",
    ignoredKeys: null
};

/**
 * Main explanation map object for full output
 * @type {IExplanationMap}
 * @memberof IPublishedTemplate
 */
export const explainPublishedTemplateFull: IExplanationMap = {
    ...prettyFull,
    explainedParentKey: "Published Templates",
    ignoredKeys: null
};
