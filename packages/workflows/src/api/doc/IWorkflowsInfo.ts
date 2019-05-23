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

/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IWorkflowsInfo
 */
export interface IWorkflowsInfo {
    /**
     * The user ID that identifies the owner of the software.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    owner?: string;

    /**
     * Unique workflow key.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowKey?: string;

    /**
     * Descriptive name for the workflow.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowName?: string;

    /**
     * Version of the workflow.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowVersion?: string;

    /**
     * Description of the workflow.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowDescription?: string;

    /**
     * Short ID that identifies the workflow.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowID?: string;

    /**
     * The vendor of the software.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    vendor?: string;

    /**
     * Nickname of the system on which the workflow is to be performed.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    system?: string;

    /**
     * The category of the software workflow.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    category?: string;

    /**
     * Indicates the current workflow status.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    statusName?: string;

    /**
     * Indicates the URI of archived workflow.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    archivedInstanceURI?: string;

    /**
     * Indicates the status of deletion
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    deletionStatus?: string;

}

