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

import { IVariable } from "./IVariable";

export type accessT = "Public" | "Private" | "Restricted";

/**
 * Interface for creating workflow objects.
 * @export
 * @interface ICreateWorkflow
 */
export interface ICreateWorkflow {
    /**
     * Unique workflow name.
     * @type {string}
     * @memberof ICreateWorkflow
     */
    workflowName: string;

    /**
     * Path to workflow definition file.
     * Xml in USS or Dataset
     * @type {string}
     * @memberof ICreateWorkflow
     */
    workflowDefinitionFile: string;

    /**
     * Unique workflow name.
     * @type {string}
     * @memberof ICreateWorkflow
     */
    system: string;

    /**
     * Unique workflow name.
     * @type {string}
     * @memberof ICreateWorkflow
     */
    owner: string;

    /**
     * Path to file with variables.
     * USS file with .properties extension or Dataset
     * @type {string}
     * @memberof ICreateWorkflow
     */
    variableInputFile?: string;

    /**
     * Variables to be passed to workflow
     * Can be used to change values of variables that
     * are in input file.
     * @type {IVariable[]}
     * @memberof ICreateWorkflow
     */
    variables?: IVariable[];

    /**
     * Assign workflow steps to owner.
     * @type {string}
     * @memberof ICreateWorkflow
     */
    assignToOwner?: boolean;

    /**
     * Workflow access type
     * @type {string}
     * @memberof ICreateWorkflow
     */
    accessType?: accessT;

    /**
     * Delete completed jobs.
     * @type {string}
     * @memberof ICreateWorkflow
     */
    deleteCompletedJobs?: boolean;

    // TODO
    // resolveGlobalConflictByUsing?: "global" | "input";
    // accountInfo?: string;
    // jobStatement?: string;
    // comments?: string;

    jobStatement?: string;
}