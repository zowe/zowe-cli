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

// get workflow definition object (table 2 wf definition request)
import { IStepDefinition } from "./IStepDefinition";
import { IVariableDefinition } from "./IVariableDefinition";

/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IWorkflowDefinition
 */
export interface IWorkflowDefinition {
    /**
     * Identifies workflow default name.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    workflowDefaultName: string;

    /**
     * Description of workflow.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    workflowDescription: string;

    /**
     * Short ID that identifies the workflow.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    workflowID: string;

    /**
     * Version of the workflow definition file.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    workflowVersion: string;

    /**
     * 128bit hash associated with definition file.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    workflowDefinitionFileMD5Value: string;

    /**
     * Name of the vendor.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    vendor: string;

    /**
     * Indicates if workflow can be called by other workflow.
     * @type {boolean}
     * @memberof IWorkflowDefinition
     */
    isCallable: boolean;

    /**
     * Indicates if workflow steps can run in parallel.
     * @type {boolean}
     * @memberof IWorkflowDefinition
     */
    containsParallelSteps?: boolean;

    /**
     * Restrict a workflow to one instance only.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    scope: string;

    /**
     * Category of workflow.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    category: string;

    /**
     * Identifier of product configured via workflow.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    productID: string;

    /**
     * Name of the product configured via workflow.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    productName: string;

    /**
     * Version of the product configured via workflow.
     * @type {string}
     * @memberof IWorkflowDefinition
     */
    productVersion: string;

    /**
     * Aray of one or more step-definition objects.
     * @type {IStepDefinition[]}
     * @memberof IWorkflowDefinition
     */
    steps?: IStepDefinition[];

    /**
     * Aray of one or more variable-definition objects.
     * @type {IVariableDefinition[]}
     * @memberof IWorkflowDefinition
     */
    variables?: IVariableDefinition[];

}
