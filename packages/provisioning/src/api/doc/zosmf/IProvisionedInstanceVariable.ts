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
 * Interface for provisioned instance variables.
 * @export
 * @interface IProvisionedInstanceVariable
 */
export interface IProvisionedInstanceVariable {
    /**
     * Name of the variable.
     * @type {string}
     * @memberof IProvisionedInstanceVariable
     */
    name: string;

    /**
     * Value of the variable.
     * @type {string}
     * @memberof IProvisionedInstanceVariable
     */
    value: string;

    /**
     * Visibility of the variable.
     * @type {string}
     * @memberof IProvisionedInstanceVariable
     */
    visibility: string;

    /**
     * Indicates whether to update the variables in the instance from the workflow.
     * @type {string}
     * @memberof IProvisionedInstanceVariable
     */
    "update-registry": string;
}

/**
 * Explained keys for summary.
 * @memberof IProvisionedInstanceVariable
 */
const pretty: {
    [key: string]: string;
} = {
    "name": "Name",
    "value": "Value",
    "visibility": "Visibility",
    "update-registry": "Update Registry"
};

/**
 * Main explanation map object for the output of provisioned instance variables.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IProvisionedInstanceVariable
 */
export const explainProvisionedInstanceVariable: IExplanationMap = {
    ...pretty,
    explainedParentKey: "Variables",
    ignoredKeys: null
};

/**
 * Main explanation map object for provisioned instance prompt variables output.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IProvisionedInstanceVariable
 */
export const explainPromptVariable: IExplanationMap = {
    ...pretty,
    explainedParentKey: "Prompt Variables",
    ignoredKeys: null
};

/**
 * Main explanation map object for create provisioned instance variables.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IProvisionedInstanceVariable
 */
export const explainAtCreateVariable: IExplanationMap = {
    ...pretty,
    explainedParentKey: "At Create Variables",
    ignoredKeys: null
};
