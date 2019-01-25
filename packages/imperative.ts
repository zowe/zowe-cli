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

// WIP Imperative version of Zowe CLI
import { IImperativeConfig } from "@brightside/imperative";
import { Constants } from "./Constants";

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
                        optionDefinition: {
                            name: "host",
                            aliases: ["H"],
                            description: "The z/OSMF server host name.",
                            type: "string",
                            required: true,
                        },
                    },
                    port: {
                        type: "number",
                        optionDefinition: {
                            name: "port",
                            aliases: ["P"],
                            description: "The z/OSMF server port.",
                            type: "number",
                            defaultValue: 443,
                        },
                    },
                    user: {
                        type: "string",
                        secure: true,
                        optionDefinition: {
                            name: "user",
                            aliases: ["u"],
                            description: "Mainframe (z/OSMF) user name, which can be the same as your TSO login.",
                            type: "string",
                            implies: ["password"],
                        },
                    },
                    pass: {
                        type: "string",
                        secure: true,
                        optionDefinition: {
                            name: "password",
                            aliases: ["p"],
                            description: "Mainframe (z/OSMF) password, which can be the same as your TSO password.",
                            type: "string",
                            implies: ["user"],
                        },
                    },
                    rejectUnauthorized: {
                        type: "boolean",
                        optionDefinition: {
                            name: "reject-unauthorized",
                            aliases: ["ru"],
                            description: "Reject self-signed certificates.",
                            type: "boolean",
                            defaultValue: "true",
                        },
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
                        optionDefinition: {
                            name: "account",
                            aliases: ["a"],
                            description: "Your z/OS TSO/E accounting information.",
                            type: "string",
                            required: true,
                        },
                    },
                    characterSet: {
                        type: "string",
                        optionDefinition: {
                            name: "character-set",
                            aliases: ["cs"],
                            description: "Character set for address space to convert messages and responses from UTF-8 to EBCDIC.",
                            type: "string",
                            defaultValue: "697",
                        },
                    },
                    codePage: {
                        type: "string",
                        optionDefinition: {
                            name: "code-page",
                            aliases: ["cp"],
                            description: "Codepage value for TSO/E address space to convert messages and responses from UTF-8 to EBCDIC.",
                            type: "string",
                            defaultValue: "1047",
                        },
                    },
                    columns: {
                        type: "number",
                        optionDefinition: {
                            name: "columns",
                            aliases: ["cols"],
                            description: "The number of columns on a screen.",
                            type: "number",
                            defaultValue: 80,
                        },
                    },
                    logonProcedure: {
                        type: "string",
                        optionDefinition: {
                            name: "logon-procedure",
                            aliases: ["l"],
                            description: "The logon procedure to use when creating TSO procedures on your behalf.",
                            type: "string",
                            defaultValue: "IZUFPROC",
                        },
                    },
                    regionSize: {
                        type: "number",
                        optionDefinition: {
                            name: "region-size",
                            aliases: ["rs"],
                            description: "Region size for the TSO/E address space.",
                            type: "number",
                            defaultValue: 4096,
                        },
                    },
                    rows: {
                        type: "number",
                        optionDefinition: {
                            name: "rows",
                            description: "The number of rows on a screen.",
                            type: "number",
                            defaultValue: 24,
                        },
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
            ]
        },
    ]
};
module.exports = config;
