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

import { IProfLocOsLoc } from "./IProfLoc";
import { IProfMergedArg } from "./IProfMergedArg";

export interface IProfInfoRemoveKnownPropOpts extends IProfInfoRemoveKnownPropCommonOpts {
    /**
     * Merged arguments object describing the location of the property to update
     */
    mergedArgs: IProfMergedArg;

    /**
     * Optional osLoc information.
     * This will allow the updateKnownProperty function to switch active layer if needed
     */
    osLocInfo?: IProfLocOsLoc;
}

export interface IProfInfoRemoveKnownPropCommonOpts {
    /**
     * Property to remove
     */
    property: string;
}