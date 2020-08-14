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
 * @interface IPropertyMapping
 */
// variable-reference object (table 8)
export interface IPropertyMapping {
    /**
     * Property from REST req.
     * @type {string}
     * @memberof IPropertyMapping
     */
    mapFrom: string;

    /**
     * Assigned workflow variable.
     * @type {string}
     * @memberof IPropertyMapping
     */
    mapTo: string;
}
