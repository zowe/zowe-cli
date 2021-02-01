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
 * Options for the List Workflows API
 * @export
 * @interface IGetWorkflowsOptions
 */
export interface IGetWorkflowsOptions {
    /**
     * Version of z/OS MF Workflow APIs.
     * @type {string}
     * @memberof IWorkflowInfo
     */
    zOSMFVersion?: string;
    /**
     * Unique workflow name.
     * @type {string}
     * @memberof IWorkflowInfo
     */
    workflowName?: string;
    /**
     * Category of workflow.
     * @type {string}
     * @memberof IWorkflowInfo
     */
    category?: string;
    /**
     * Full name of z/OS system.
     * @type {string}
     * @memberof IWorkflowInfo
     */
    system?: string;
    /**
     * Unique workflow name.
     * @type {string}
     * @memberof IWorkflowInfo
     */
    owner?: string;
    /**
     * Unique workflow name.
     * @type {string}
     * @memberof IWorkflowInfo
     */
    vendor?: string;
    /**
     * Unique workflow name.
     * @type {string}
     * @memberof IWorkflowInfo
     */
    statusName?: string;

    // Index signature
    [key: string]: any;
}
