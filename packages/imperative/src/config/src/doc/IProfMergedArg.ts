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

import { IProfArgAttrs } from "./IProfArgAttrs";

/**
 * The result object from mergeProfileArgs().
 */
export interface IProfMergedArg {
    /**
     * The list of arguments with known values.
     * All of the attributes in IProfArgAttrs will be filled in except
     * when knownArgs[i].argLoc.osLoc (and/or jsonLoc) are not
     * relevant for the type of location (locType).
     * Additionally, the missingArgs[i].argValue attribute will be undefined
     * for arguments with secure = true since their values are sensitive data.
     * Use ProfileInfo.loadSecureArg to load a secure argument's value.
     */
    knownArgs: IProfArgAttrs[];

    /**
     * The list of required arguments for which no value has been specified.
     * Obviously, the missingArgs[i].argValue attribute will not exist.
     * Note that a generated team configuration template can contain some
     * arguments with an empty string as a value. Such arguments will be
     * contained in this missing list. The other missing arguments will
     * have a missingArgs[i].argLoc, derived from the location of the
     * profile specified to the function mergeProfileArgs().
     */
    missingArgs: IProfArgAttrs[];
}
