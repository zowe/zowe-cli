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
import { explainPublishedTemplateFull, explainPublishedTemplateSummary, IPublishedTemplate } from "./IPublishedTemplate";

/**
 * The list of published templates.
 * @export
 * @interface IPublishedTemplates
 */
export interface IPublishedTemplates {

    /**
     * Published software service templates.
     * @type IPublishedTemplate[], @see {IPublishedTemplate}
     * @memberof IPublishedTemplates
     */
    "psc-list": IPublishedTemplate[];
}

/**
 * Main explanation map object for summary output.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IPublishedTemplates
 */
export const explainPublishedTemplatesSummary: IExplanationMap = {
    "psc-list": explainPublishedTemplateSummary,
    "explainedParentKey": null,
    "ignoredKeys": null,
};

/**
 * Main explanation map object for full output.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IPublishedTemplates
 */
export const explainPublishedTemplatesFull: IExplanationMap = {
    "psc-list": explainPublishedTemplateFull,
    "explainedParentKey": null,
    "ignoredKeys": null,
};
