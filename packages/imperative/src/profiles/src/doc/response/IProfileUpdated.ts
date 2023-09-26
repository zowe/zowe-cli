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

import { IProfile } from "../definition/IProfile";
/**
 * The success response to the profile "update()" API.
 * @export
 * @interface IProfileUpdated
 */
export interface IProfileUpdated {
    /**
     * The path to the profile that was updated
     */
    path: string;
    /**
     * A message for display purposes
     */
    message: string;
    /**
     * The contents of the profile
     */
    profile?: IProfile;
}
