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

import { AbstractSession } from "@zowe/imperative";
import { accessT } from "./ICreateWorkflow";


/**
 * Parameters for the createWorkflow method.
 *
 * @export
 * @interface IParamsCreateWorkflow
 */
export interface IParamsCreateWorkflow {
    /**
     * z/OSMF session for the workflow creation.
     *
     * @type {AbstractSession}
     * @memberof IParamsCreateWorkflow
     */
    session: AbstractSession;

    /**
     * Workflow title.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflow
     */
    WorkflowName: string;

    /**
     * Workflow definition file on the mainframe.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflow
     */
    WorkflowDefinitionFile: string;

    /**
     * Name of the LPAR where the workflow will be executed.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflow
     */
    systemName: string;

    /**
     * Owner that will be associated with the workflow.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflow
     */
    Owner: string;

    /**
     * Variable input file to supply the workflow with parameters.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflow
     */
    VariableInputFile?: string;

    /**
     * Additional variables you wish to supply to the workflow.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflow
     */
    Variables?: string;

    /**
     * Choose whether the steps of the workflow should be assigned to the owner of the workflow.
     *
     * @type {boolean}
     * @memberof IParamsCreateWorkflow
     */
    AssignToOwner?: boolean;

    /**
     * Access type for the workflow
     *
     * @type {accessT}
     * @memberof IParamsCreateWorkflow
     */
    AccessType?: accessT;

    /**
     * Choose whether the jobs submitted by the workflow should be deleted upon completion.
     *
     * @type {boolean}
     * @memberof IParamsCreateWorkflow
     */
    DeleteCompletedJobs?: boolean;

    /**
     * Custom JOB statement to be used by the workflow instead of the default one.
     *
     * @type {Array<string>}
     * @memberof IParamsCreateWorkflow
     */
    JobStatement?: Array<string>;

    /**
     * Version of the z/OSMF REST API.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflow
     */
    zOSMFVersion?: string;
}