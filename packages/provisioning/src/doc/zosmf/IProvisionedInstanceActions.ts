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
import {
    explainAtCreateVariable,
    explainPromptVariable,
    explainProvisionedInstanceVariable,
    IProvisionedInstanceVariable
} from "./IProvisionedInstanceVariable";


/**
 * Interface for provisioned instance actions.
 * @export
 * @interface IProvisionedInstanceActions
 */
export interface IProvisionedInstanceActions {
    /**
     * The name of the action. If the name of the action is deprovision,
     * the action is for deprovisioning the software.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    name: string;

    /**
     * The type of the action.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    type: string;

    /**
     * For command type actions, the command.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    command: string;

    /**
     * For instruction type actions, the instructions.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    instructions: string;

    /**
     * Indicates if the action deprovisions the software.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    "is-deprovision": string;

    /**
     * For command type actions, if provided, the user ID to be used when the command is run.
     * This is not valid when the registry-type is general.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    "command-run-as-user": string;

    /**
     * For command type actions, if provided, the key to search for in the solicited messages command response.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    "command-sol-key": string;

    /**
     * For command type actions, if provided, the key to search for in the unsolicited messages.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    "command-unsol-key": string;

    /**
     * For command type actions, if provided, the time in seconds to detect the command-unsol-key.
     * in the unsolicited messages.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    "command-detect-time": string;

    /**
     * For workflow type actions, the workflow definition file.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    "workflow-definition-file": string;

    /**
     * For workflow type actions, if provided, the workflow variable input file.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    "workflow-variable-input-file": string;

    /**
     * For workflow type actions, if provided, specifies whether the instance of the workflow
     * is deleted after it completes.
     * @type {string}
     * @memberof IProvisionedInstanceActions
     */
    "workflow-clean-after-complete": string;

    /**
     * For workflow type actions, if provided, the workflow variables.
     * @type {IProvisionedInstanceVariable[]}
     * @memberof IProvisionedInstanceActions
     */
    variables: IProvisionedInstanceVariable[];

    /**
     * For workflow type actions, if provided, the prompt variables, which are the variables
     * that are expected to be prompted for in preparation for running the software services template.
     * @type {IProvisionedInstanceVariable[]}
     * @memberof IProvisionedInstanceActions
     */
    "prompt-variables": IProvisionedInstanceVariable[];

    /**
     * These are the only variables allowed on input-variables for the do action operation.
     * @type {IProvisionedInstanceVariable[]}
     * @memberof IProvisionedInstanceActions
     */
    "at-create-variables": IProvisionedInstanceVariable[];
}


/**
 * Explained keys for summary.
 * @memberof IProvisionedInstanceActions
 */
const prettySummary: {
    [key: string]: string;
} = {
    name: "Name"
};

/**
 * Explained keys for full.
 * @memberof IProvisionedInstanceActions
 */
const prettyFull: {
    [key: string]: string;
} = {
    ...prettySummary,
    "type": "Value",
    "command": "Command",
    "instructions": "Instructions",
    "is-deprovision": "Deprovision?",
    "command-run-as-user": "Command Run As User",
    "command-sol-key": "Command Solicited Key",
    "command-unsol-key": "Command Un-Solicited Key",
    "command-detect-time": "Command Detect Time",
    "workflow-definition-file": "Workflow Definition File",
    "workflow-variable-input-file": "Workflow Variable Input File",
    "workflow-clean-after-complete": "Workflow Clean After Complete"
};

/**
 * Main explanation map object for full output.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IProvisionedInstanceActions
 */
export const explainProvisionedInstanceActionsFull: IExplanationMap = {
    ...prettyFull,
    "variables": explainProvisionedInstanceVariable,
    "prompt-variables": explainPromptVariable,
    "at-create-variables": explainAtCreateVariable,
    "explainedParentKey": "Actions",
    "ignoredKeys": null
};

/**
 * Main explanation map object for summary output.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IProvisionedInstanceActions
 */
export const explainProvisionedInstanceActionsSummary: IExplanationMap = {
    ...prettySummary,
    explainedParentKey: "Actions",
    ignoredKeys: null
};
