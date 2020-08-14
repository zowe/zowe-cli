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
export interface ICreatedWorkflow {
    /**
     * Unique workflow key.
     * @type {string}
     * @memberof ICreatedWorkflow
     */
    workflowKey: string;

    /**
     * Description of the workflow.
     * @type {string}
     * @memberof ICreatedWorkflow
     */
    workflowDescription: string;

    /**
     * Workflow ID.
     * @type {string}
     * @memberof ICreatedWorkflow
     */
    workflowID: string;

    /**
     * Version of the workflow.
     * @type {string}
     * @memberof ICreatedWorkflow
     */
    workflowVersion: string;

    /**
     * Workflow vendor.
     * @type {string}
     * @memberof ICreatedWorkflow
     */
    vendor: string;
}
