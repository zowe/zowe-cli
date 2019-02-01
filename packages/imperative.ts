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

// WIP Imperative version of Brightside
import { IImperativeConfig } from "@brightside/imperative";
import { Constants } from "./Constants";
import { ZosmfSession } from "./zosmf";
import {
    TSO_OPTION_ACCOUNT,
    TSO_OPTION_CHAR_SET,
    TSO_OPTION_CODE_PAGE,
    TSO_OPTION_COLUMNS,
    TSO_OPTION_LOGON_PROCEDURE,
    TSO_OPTION_REGION_SIZE,
    TSO_OPTION_ROWS
} from "./zostso/src/cli/constants/ZosTso.constants";

const config: IImperativeConfig = {
    productDisplayName: Constants.DISPLAY_NAME,
    commandModuleGlobs: ["**/cli/*.definition!(.d).*s"],
    rootCommandDescription: Constants.DESCRIPTION,
    defaultHome: Constants.HOME_DIR,
    envVariablePrefix: Constants.ENV_PREFIX,
    logging: {
        appLogging: {
            logFile: Constants.LOG_LOCATION
        },
    },
    profiles: [
        {
            type: "zosmf",
            schema: {
                type: "object",
                title: "z/OSMF Profile",
                description: "z/OSMF Profile",
                properties: {
                    host: {
                        type: "string",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_HOST,
                    },
                    port: {
                        type: "number",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_PORT,
                    },
                    user: {
                        type: "string",
                        secure: true,
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_USER,
                    },
                    password: {
                        type: "string",
                        secure: true,
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_PASSWORD,
                    },
                    rejectUnauthorized: {
                        type: "boolean",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_REJECT_UNAUTHORIZED,
                    },
                    basePath: {
                        type: "string",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_BASE_PATH,
                    },
                },
                required: ["host"],
            },
            createProfileExamples: [
                {
                    options: "zos123 --host zos123 --port 1443 --user ibmuser --password myp4ss",
                    description: "Create a zosmf profile called 'zos123' to connect to z/OSMF at host zos123 and port 1443"
                },
                {
                    options: "zos124 --host zos124 --user ibmuser --password myp4ss --reject-unauthorized false",
                    description: "Create a zosmf profile called 'zos124' to connect to z/OSMF at the host zos124 (default port - 443) " +
                        "and allow self-signed certificates"
                },
                {
                    options: "zosAPIML --host zosAPIML --port 2020 --user ibmuser --password myp4ss --reject-unauthorized false --base-path basePath",
                    description: "Create a zosmf profile called 'zos124' to connect to z/OSMF at the host zos124 (default port - 443) " +
                        "and allow self-signed certificates"
                }
            ],
            updateProfileExamples: [
                {
                    options: "zos123 --user newuser --password newp4ss",
                    description: "Update a zosmf profile named 'zos123' with a new username and password"
                }
            ]
        },
        {
            type: "tso",
            schema: {
                type: "object",
                title: "TSO Profile",
                description: "z/OS TSO/E User Profile",
                properties: {
                    account: {
                        type: "string",
                        optionDefinition: TSO_OPTION_ACCOUNT,
                    },
                    characterSet: {
                        type: "string",
                        optionDefinition: TSO_OPTION_CHAR_SET,
                    },
                    codePage: {
                        type: "string",
                        optionDefinition: TSO_OPTION_CODE_PAGE,
                    },
                    columns: {
                        type: "number",
                        optionDefinition: TSO_OPTION_COLUMNS,
                    },
                    logonProcedure: {
                        type: "string",
                        optionDefinition: TSO_OPTION_LOGON_PROCEDURE,
                    },
                    regionSize: {
                        type: "number",
                        optionDefinition: TSO_OPTION_REGION_SIZE,
                    },
                    rows: {
                        type: "number",
                        optionDefinition: TSO_OPTION_ROWS,
                    },
                },
                required: ["account"],
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
                }
            ],
            updateProfileExamples: [
                {
                    description: "Update a tso profile called myprof with new JES accounting information",
                    options: "myprof -a NEWACCT"
                }
            ]
        },
    ]
};
module.exports = config;
