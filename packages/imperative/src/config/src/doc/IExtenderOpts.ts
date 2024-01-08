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

export type IExtendersJsonOpts = {
    profileTypes: Record<string, {
        // The list of application sources that contribute this profile type.
        from: string[];
        // The current version of the installed schema, if one was provided during type registration.
        version?: string;
        // Only will be set if there was an existing schema version present.
        // Otherwise, we can assume that the last entry in the `from` array has contributed the latest schema.
        latestFrom?: string;
    }>;
};

export type IAddProfTypeResult = {
    // Whether the `addProfileTypeToSchema` function successfully added the schema.
    success: boolean;
    // Any additional information from the `addProfileTypeToSchema` result.
    // If `success` is false, `info` contains any context for why the function failed.
    info: string;
};