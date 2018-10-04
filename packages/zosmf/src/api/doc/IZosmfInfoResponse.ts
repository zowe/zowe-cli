/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { IZosmfPluginInfo } from "./IZosmfPluginInfo";

/**
 * The Z/OSMF info API response.
 * @export
 * @interface IZosmfInfoResponse
 */
export interface IZosmfInfoResponse {
    zos_version?: string;
    zosmf_port?: string;
    zosmf_version?: string;
    zosmf_hostname?: string;
    zosmf_saf_realm?: string;
    zosmf_full_version?: string;
    api_version?: string;
    plugins?: [IZosmfPluginInfo];
}
