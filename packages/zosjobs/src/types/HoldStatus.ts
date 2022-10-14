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
 * The possible hold status strings (as specified by the z/OSMF documentation). Used in the Jobs APIs for modifying
 * holdStatus.
 * @type {HOLD_STATUS} (string)
 */
export type HOLD_STATUS = "hold" | "release";
export const HOLD_STATUS = {
    HOLD: "hold" as HOLD_STATUS,
    RELEASE: "release" as HOLD_STATUS,
};