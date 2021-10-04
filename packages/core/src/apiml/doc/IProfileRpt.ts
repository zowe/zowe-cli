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

import { IBaseProfileOverride } from "..";
import { IAltProfile } from "./IAltProfile";


/**
 * As part of the auto-init output report, this structure
 * represents the set of profiles created or modified by
 * the auto-init command.
 */
export interface IProfileRpt {
    changeForProf: string;      // was the profile created, modified, etc?
    profName: string;           // profile name
    profType: string;           // profile type
    basePath: string;           // basePath
    pluginNms: string[];        // names of plugins using this profile
    altProfiles: IAltProfile[]; // alternate profiles for this profile
    baseOverrides: IBaseProfileOverride[];
}
