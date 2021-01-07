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
 * Interface for variable definition object.
 * @export
 * @interface IVariableDefinition
 */
// variable-definition object (table 7)
export interface IVariableDefinition {
    /**
     * Name of the variable.
     * @type {string}
     * @memberof IVariableDefinition
     */
    name: string;

    /**
     * Variable scope.
     * @type {string}
     * @memberof IVariableDefinition
     */
    scope: string;

    /**
     * Brief description of variable.
     * @type {string}
     * @memberof IVariableDefinition
     */
    abstract: string;

    /**
     * Name of logical variable group.
     * @type {string}
     * @memberof IVariableDefinition
     */
    category: string;

    /**
     * Choice value.
     * @type {string[]}
     * @memberof IVariableDefinition
     */
    choice: string[];

    /**
     * Maximum number of decimal places.
     * @type {number}
     * @memberof IVariableDefinition
     */
    decimalPlaces: number;

    /**
     * Default value of variable.
     * @type {string}
     * @memberof IVariableDefinition
     */
    default: string;

    /**
     * Description of variable.
     * @type {string}
     * @memberof IVariableDefinition
     */
    description: string;

    /**
     * Whether variable displayed.
     * @type {boolean}
     * @memberof IVariableDefinition
     */
    exposeToUser: boolean;

    /**
     * Maximum length of variable value.
     * @type {number}
     * @memberof IVariableDefinition
     */
    maxLength: number;

    /**
     * Maximum value of variable.
     * @type {string}
     * @memberof IVariableDefinition
     */
    maxValue: string;

    /**
     * Minimum length of variable value.
     * @type {number}
     * @memberof IVariableDefinition
     */
    minLength: number;

    /**
     * Minimum value of variable.
     * @type {string}
     * @memberof IVariableDefinition
     */
    minValue: string;

    /**
     * Whether variable is prompted at create.
     * @type {boolean}
     * @memberof IVariableDefinition
     */
    promptAtCreate: boolean;

    /**
     * Standard regular expression.
     * @type {string}
     * @memberof IVariableDefinition
     */
    regularExpression: string;

    /**
     * Whether variable must be specified.
     * @type {boolean}
     * @memberof IVariableDefinition
     */
    requiredAtCreate: boolean;

    /**
     * Type of variable.
     * @type {string}
     * @memberof IVariableDefinition
     */
    type: string;

    /**
     * Validation type of variable.
     * @type {string}
     * @memberof IVariableDefinition
     */
    validationType: string;

    /**
     * Indicates if display variable to Workflows users (public or private).
     * @type {string}
     * @memberof IVariableDefinition
     */
    visibility: string;
}
