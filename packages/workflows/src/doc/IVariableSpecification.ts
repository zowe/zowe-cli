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
 * Interface for variable-specification object.
 * @export
 * @interface IVariableSpecification
 */
// variable-specification object (table 6)
export interface IVariableSpecification {
    /**
     * Name of the variable.
     * @type {string}
     * @memberof IVariableSpecification
     */
    name: string;

    /**
     * Variable scope.
     * @type {string}
     * @memberof IVariableSpecification
     */
    scope: string;

    /**
     * Indicates if is variable required.
     * @type {boolean}
     * @memberof IVariableSpecification
     */
    required: boolean;
}
