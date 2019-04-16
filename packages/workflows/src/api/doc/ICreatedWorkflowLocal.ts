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

/**
 * Interface for created workflow objects.
 * @export
 * @interface IVariable
 */
export interface ICreatedWorkflowLocal {
    /**
     * Unique workflow key.
     * @type {string}
     * @memberof ICreatedWorkflowLocal
     */
    workflowKey: string;

    /**
     * Description of the workflow.
     * @type {string}
     * @memberof ICreatedWorkflowLocal
     */
    workflowDescription: string;

    /**
     * Workflow ID.
     * @type {string}
     * @memberof ICreatedWorkflowLocal
     */
    workflowID: string;

    /**
     * Version of the workflow.
     * @type {string}
     * @memberof ICreatedWorkflowLocal
     */
    workflowVersion: string;

    /**
     * Workflow vendor.
     * @type {string}
     * @memberof ICreatedWorkflowLocal
     */
    vendor: string;

    /**
     * Uss files that were not deleted.
     * @type {string}
     * @memberof ICreatedWorkflowLocal
     */
    failedToDelete?: string;

    /**
     * Files that were kept
     * @type {string}
     * @memberof ICreatedWorkflowLocal
     */
    filesKept?: string;
}
