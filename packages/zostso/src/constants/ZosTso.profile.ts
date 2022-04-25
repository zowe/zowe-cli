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

import { ICommandProfileTypeConfiguration } from "@zowe/imperative";
import { TSO_OPTION_ACCOUNT_PROFILE, TSO_OPTION_CHAR_SET, TSO_OPTION_CODE_PAGE, TSO_OPTION_COLUMNS, TSO_OPTION_LOGON_PROCEDURE, TSO_OPTION_REGION_SIZE, TSO_OPTION_ROWS } from "./ZosTso.constants";

/**
 * Messages to be used as command responses for different scenarios
 * @type { ICommandProfileTypeConfiguration }
 * @memberof ZosUssMessages
 */
export const ZosTsoProfile: ICommandProfileTypeConfiguration = {
    type: "tso",
    schema: {
        type: "object",
        title: "TSO Profile",
        description: "z/OS TSO/E User Profile",
        properties: {
            account: {
                type: "string",
                optionDefinition: TSO_OPTION_ACCOUNT_PROFILE,
                includeInTemplate: true
            },
            characterSet: {
                type: "string",
                optionDefinition: TSO_OPTION_CHAR_SET
            },
            codePage: {
                type: "string",
                optionDefinition: TSO_OPTION_CODE_PAGE,
                includeInTemplate: true
            },
            columns: {
                type: "number",
                optionDefinition: TSO_OPTION_COLUMNS
            },
            logonProcedure: {
                type: "string",
                optionDefinition: TSO_OPTION_LOGON_PROCEDURE,
                includeInTemplate: true
            },
            regionSize: {
                type: "number",
                optionDefinition: TSO_OPTION_REGION_SIZE
            },
            rows: {
                type: "number",
                optionDefinition: TSO_OPTION_ROWS
            }
        },
        required: []
    },
    createProfileExamples: [
        {
            description: "Create a tso profile called 'myprof' with default settings and JES accounting information of 'IZUACCT'",
            options: "myprof -a IZUACCT"
        },
        {
            description: "Create a tso profile called 'largeregion' with a region size of 8192, a logon procedure of MYPROC, and " +
                "JES accounting information of '1234'",
            options: "largeregion -a 1234 --rs 8192"
        },
        {
            description: "Create a tso profile called 'myprof2' with default settings and region size of 8192, without storing the user " +
                "account on disk",
            options: "myprof2 --rs 8192"
        }
    ],
    updateProfileExamples: [
        {
            description: "Update a tso profile called myprof with new JES accounting information",
            options: "myprof -a NEWACCT"
        }
    ]
};
