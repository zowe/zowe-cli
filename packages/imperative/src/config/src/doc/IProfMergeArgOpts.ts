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
 * Options that will affect the behavior of the ProfileInfo class.
 * They are supplied on the ProfileInfo constructor.
 */
export interface IProfMergeArgOpts {
    /**
     * Indicates whether secure values should be loaded when
     * ProfileInfo.mergeArgsForXXX functions are called.
     * When true, the secure values are contained in the result of
     * the function. When false, placeholders are returned in the result
     * and the calling function must call loadSecureArg() for each such
     * placeholder to get the actual value. The false option is considered
     * more secure because actual secure values will not reside in memory
     * until the calling app explicitly asks for an actual value.
     * The default is false.
     */
    getSecureVals?: boolean;
}
