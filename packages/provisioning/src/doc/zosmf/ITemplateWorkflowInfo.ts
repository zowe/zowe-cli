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
 * Interface for the response body returned from the creation of a workflow.
 * @export
 * @interface ITemplateWorkflowInfo
 */
export interface ITemplateWorkflowInfo {
    /**
     * Unique workflow key.
     * @type {string}
     * @memberof ITemplateWorkflowInfo
     */
    workflowKey: string;

    /**
     * Description of the workflow.
     * @type {string}
     * @memberof ITemplateWorkflowInfo
     */
    workflowDescription: string;

    /**
     * ID of the workflow.
     * @type {string}
     * @memberof ITemplateWorkflowInfo
     */
    workflowID: string;

    /**
     * Version of the workflow.
     * @type {string}
     * @memberof ITemplateWorkflowInfo
     */
    workflowVersion: string;

    /**
     * Vendor name.
     * @type {string}
     * @memberof ITemplateWorkflowInfo
     */
    vendor: string;
}

/**
 * Main explanation map object for workflow-info response output.
 * @type {IExplanationMap}
 * @memberof ITemplateRegistryInfo
 */
export const explainTemplateWorkflowInfoResponse: IExplanationMap = {
    explainedParentKey: "Workflow Info",
    ignoredKeys: null,
    workflowKey: "Key",
    workflowDescription: "Description",
    workflowID: "Id",
    workflowVersion: "Version",
    vendor: "Vendor"
};
