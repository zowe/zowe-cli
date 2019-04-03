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

// variable-info object (table 9)
/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IVariableInfo
 */
export interface IVariableInfo{

    /**
     * Name of variable.
     * @type {string}
     * @memberof IVariableInfo
     */
    name: string;

    /**
     * Variable scope.
     * @type {string}
     * @memberof IVariableInfo
     */
    scope: string;

    /**
     * Variable type.
     * @type {string}
     * @memberof IVariableInfo
     */
    type: string;

    /**
     * Variable value.
     * @type {string}
     * @memberof IVariableInfo
     */
    value: string;

    /**
     * Variable visibility (public|private).
     * @type {string}
     * @memberof IVariableInfo
     */
    visibility: string;

}
