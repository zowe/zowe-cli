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

import { IZosFilesResponse } from "../../../doc/IZosFilesResponse";

/**
 * This interface defines the response type of {@link Delete.vsam}
 */
export interface IDeleteVsamResponse extends IZosFilesResponse {
    /**
     * Delete VSAM calls the invoke api, which returns an {@link IZosFilesResponse}
     * object. So the api response will be set to that return object.
     */
    apiResponse: IZosFilesResponse;
}
