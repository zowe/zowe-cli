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

export const ImperativeUserEvents = [
    "onVaultChanged"
] as const;
export type ImperativeUserEventType = typeof ImperativeUserEvents[number];

export const ImperativeZoweEvents = [
    "onConfigChanged",
    "onSchemaChanged",
    "onCredentialManagerChanged"
] as const;
export type ImperativeZoweEventType = typeof ImperativeZoweEvents[number];

export type ImperativeEventType = ImperativeUserEventType | ImperativeZoweEventType;
