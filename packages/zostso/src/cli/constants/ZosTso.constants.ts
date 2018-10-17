/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandOptionDefinition } from "@brightside/imperative";

export const TSO_OPTION_GROUP: string = "TSO OPTIONS";

export const TSO_OPTION_ACCOUNT: ICommandOptionDefinition = {
    name: "account",
    aliases: ["a"],
    description: "Your z/OS TSO/E accounting information.",
    type: "string",
    required: true,
    group: TSO_OPTION_GROUP
};

export const TSO_OPTION_CHAR_SET: ICommandOptionDefinition = {
    name: "character-set",
    aliases: ["cs"],
    description: "Character set for address space to convert messages and responses from UTF-8 to EBCDIC.",
    type: "string",
    defaultValue: "697",
    group: TSO_OPTION_GROUP
};

export const TSO_OPTION_CODE_PAGE: ICommandOptionDefinition = {
    name: "code-page",
    aliases: ["cp"],
    description: "Codepage value for TSO/E address space to convert messages and responses from UTF-8 to EBCDIC.",
    type: "string",
    defaultValue: "1047",
    group: TSO_OPTION_GROUP
};

export const TSO_OPTION_COLUMNS: ICommandOptionDefinition = {
    name: "columns",
    aliases: ["cols"],
    description: "The number of columns on a screen.",
    type: "number",
    defaultValue: 80,
    group: TSO_OPTION_GROUP
};

export const TSO_OPTION_LOGON_PROCEDURE: ICommandOptionDefinition = {
    name: "logon-procedure",
    aliases: ["l"],
    description: "The logon procedure to use when creating TSO procedures on your behalf.",
    type: "string",
    defaultValue: "IZUFPROC",
    group: TSO_OPTION_GROUP
};

export const TSO_OPTION_REGION_SIZE: ICommandOptionDefinition = {
    name: "region-size",
    aliases: ["rs"],
    description: "Region size for the TSO/E address space.",
    type: "number",
    defaultValue: 4096,
    group: TSO_OPTION_GROUP
};

export const TSO_OPTION_ROWS: ICommandOptionDefinition = {
    name: "rows",
    description: "The number of rows on a screen.",
    type: "number",
    defaultValue: 24,
    group: TSO_OPTION_GROUP
};

export const TSO_PROFILE_OPTIONS: ICommandOptionDefinition[] = [
    TSO_OPTION_ACCOUNT,
    TSO_OPTION_CHAR_SET,
    TSO_OPTION_CODE_PAGE,
    TSO_OPTION_COLUMNS,
    TSO_OPTION_LOGON_PROCEDURE,
    TSO_OPTION_REGION_SIZE,
    TSO_OPTION_ROWS
];
