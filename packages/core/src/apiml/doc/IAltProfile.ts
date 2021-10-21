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
 * As part of the auto-init output report, this structure
 * represents the alternate profiles that were not selected
 * for the profile type.
 */
export interface IAltProfile {
    altProfName: string;
    altProfType: string;
    altBasePath: string;
}
