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
 * Interface for z/OSMF API response.
 * @export
 * @interface IPromptVariable
 */
export interface IPromptVariable {

    /**
     * Name of the property.
     * @type {string}
     * @memberof IPromptVariable
     */
    name: string;

    /**
     * Current value for the property.
     * @type {string}
     * @memberof IPromptVariable
     */
    value: string;

    /**
     * Indicates whether the variable value is required during the workflow create process.
     * @type {boolean}
     * @memberof IPromptVariable
     */
    required: boolean;

    /**
     * Short label for the UI widget.
     * @type {string}
     * @memberof IPromptVariable
     */
    label: string;

    /**
     * Explanation of what the variable is used for and perhaps what the syntactic requirements are.
     * @type {string}
     * @memberof IPromptVariable
     */
    description: string;

    /**
     * Brief description of the variable for the UI widget.
     * @type {string}
     * @memberof IPromptVariable
     */
    abstract: string;

    /**
     * Type of variable element: boolean, string, integer, decimal, time, date.
     * @type {string}
     * @memberof IPromptVariable
     */
    type: string;

    /**
     * Indicates whether the value must come from the provided choices.
     * @type {boolean}
     * @memberof IPromptVariable
     */
    "must-be-choice": boolean;

    /**
     * Contains allowable choices for the value of the variable.
     * @type {string[]}
     * @memberof IPromptVariable
     */
    choices: string[];

    /**
     * Standard regular expression that constrains the variable value.
     * @type {string}
     * @memberof IPromptVariable
     */
    regex: string;

    /**
     * Indicates whether the value requires a multi-line text box.
     * @type {boolean}
     * @memberof IPromptVariable
     */
    "multi-line": boolean;

    /**
     * For a string type, indicates the minimum string length of the value.
     * For all other types, indicates the minimum value required.
     * @type {string}
     * @memberof IPromptVariable
     */
    min: string;

    /**
     * For a string type, indicates the maximum string length of the value.
     * For all other types, indicates the maximum value required.
     * @type {string}
     * @memberof IPromptVariable
     */
    max: string;

    /**
     * Maximum number of decimal places that can be specified for a variable of the decimal type.
     * @type {string}
     * @memberof IPromptVariable
     */
    places: string;

    /**
     * Default error message associated with an incorrect value.
     * @type {string}
     * @memberof IPromptVariable
     */
    "error-message": string;
}


/**
 * Explained keys for summary.
 * @memberof IPromptVariable
 */
const prettySummary: {
    [key: string]: string;
} = {
    name: "Name",
    description: "Description",
    type: "Type"
};

/**
 * Explained keys for all-info.
 * @memberof IPromptVariable
 */
const prettyFull: {
    [key: string]: string;
} = {
    ...prettySummary,
    "required": "Required",
    "min": "Minimum Value/Length",
    "max": "Maximum Value/Length",
    "must-be-choice": "Select from Choices",
    "choices": "Allowable Choices"
};

/**
 * Main explanation map object for summary output.
 * @type {IExplanationMap}
 * @memberof IPromptVariable
 */
export const explainPromptVariableSummary: IExplanationMap = {
    ...prettySummary,
    ignoredKeys: "required, min, max, must-be-choice, choices",
    explainedParentKey: null
};

/**
 * Main explanation map object for full output.
 * @type {IExplanationMap}
 * @memberof IPromptVariable
 */
export const explainPromptVariableFull: IExplanationMap = {
    ...prettyFull,
    ignoredKeys: null,
    explainedParentKey: null
};
