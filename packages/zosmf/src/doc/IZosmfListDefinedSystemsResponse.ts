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

import { IDefinedSystem } from "./IDefinedSystem";

/**
 * API response for list systems defined to z/OSMF.
 * @export
 * @interface IZosmfInfoResponse
 */
export interface IZosmfListDefinedSystemsResponse {
    /**
     * Total items returned.
     */
    numRows: number;

    /**
     * Properties of each defined system.
     */
    items: IDefinedSystem[];
}
