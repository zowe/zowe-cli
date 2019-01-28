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
 * Interface for variable objects.
 * @export
 * @interface IVariable
 */
export interface IVariable {
    /**
     * Name of the variable.
     * @type {string}
     * @memberof IVariable
     */
    name: string;

    /**
     * Value of the variable.
     * @type {string}
     * @memberof IVariable
     */
    value: string;
}
