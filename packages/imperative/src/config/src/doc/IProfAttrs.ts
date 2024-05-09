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

import { IProfLoc } from "./IProfLoc";

/**
 * The identifying attributes of a profile.
 */
export interface IProfAttrs {
    /** The name of the profile */
    profName: string;

    /** The profile type (eg. "zosmf") */
    profType: string;

    /** Indicates if this is the default profile for this type */
    isDefaultProfile: boolean;

    /**
     * Location of this profile.
     * profNmLoc.ProfLocType can never be ProfLocType.ENV or
     * ProfLocType.DEFAULT, because this is the location of a profile,
     * not an argument value.
     */
    profLoc: IProfLoc;
}
