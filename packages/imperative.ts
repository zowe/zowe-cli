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

import * as path from "path";

// WIP Imperative version of Brightside
import { IImperativeConfig } from "@zowe/imperative";
import { Constants } from "./Constants";
import { ZosmfSession } from "./zosmf";
import {
    TSO_OPTION_ACCOUNT_PROFILE,
    TSO_OPTION_CHAR_SET,
    TSO_OPTION_CODE_PAGE,
    TSO_OPTION_COLUMNS,
    TSO_OPTION_LOGON_PROCEDURE,
    TSO_OPTION_REGION_SIZE,
    TSO_OPTION_ROWS
} from "./zostso/src/cli/constants/ZosTso.constants";
import { SshSession } from "./zosuss";
import { AuthConstants } from "./auth/src/cli/AuthConstants";

const config: IImperativeConfig = {
    productDisplayName: Constants.DISPLAY_NAME,
    commandModuleGlobs: ["**/cli/*.definition!(.d).*s"],
    rootCommandDescription: Constants.DESCRIPTION,
    defaultHome: Constants.HOME_DIR,
    envVariablePrefix: Constants.ENV_PREFIX,
    webHelpLogoImgPath: path.join(__dirname, "..", "web-help", "logo.png"),
    logging: {
        appLogging: {
            logFile: Constants.LOG_LOCATION
        }
    },
    baseProfile: {
        type: "base",
        schema: {
            type: "object",
            title: "Base Profile",
            description: "Base profile that stores values shared by multiple service profiles",
            properties: {
                host: {
                    type: "string",
                    optionDefinition: Constants.BASE_OPTION_HOST
                },
                port: {
                    type: "number",
                    optionDefinition: Constants.BASE_OPTION_PORT
                },
                user: {
                    type: "string",
                    secure: true,
                    optionDefinition: Constants.BASE_OPTION_USER
                },
                password: {
                    type: "string",
                    secure: true,
                    optionDefinition: Constants.BASE_OPTION_PASSWORD
                },
                rejectUnauthorized: {
                    type: "boolean",
                    optionDefinition: Constants.BASE_OPTION_REJECT_UNAUTHORIZED
                },
                tokenType: {
                    type: "string"
                },
                tokenValue: {
                    type: "string",
                    secure: true
                },
                serviceIds: {
                    type: "object"
                }
            },
            required: []
        },
        createProfileExamples: [
            {
                options: "base1 --host example.com --port 443 --user admin --password 123456",
                description: "Create a profile called 'base1' to connect to host example.com and port 443"
            },
            {
                options: "base2 --host example.com --user admin --password 123456 --reject-unauthorized false",
                description: "Create a profile called 'base2' to connect to host example.com (default port - 443) " +
                    "and allow self-signed certificates"
            },
            {
                options: "base3 --host example.com --port 1443",
                description: "Create a profile called 'base3' to connect to host example.com and port 1443, " +
                    " not specifying a username or password so they are not stored on disk; these will need to be specified on every command"
            },
            {
                options: "base4 --reject-unauthorized false",
                description: "Create a zosmf profile called 'base4' to connect to default port 443 and allow self-signed certificates, " +
                "not specifying a username, password, or host so they are not stored on disk; these will need to be specified on every command"
            }
        ],
        updateProfileExamples: [
            {
                options: "base1 --user newuser --password newp4ss",
                description: "Update a base profile named 'base1' with a new username and password"
            }
        ]
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
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_HOST_PROFILE
                    },
                    port: {
                        type: "number",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_PORT
                    },
                    user: {
                        type: "string",
                        secure: true,
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_USER_PROFILE
                    },
                    password: {
                        type: "string",
                        secure: true,
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_PASSWORD_PROFILE
                    },
                    rejectUnauthorized: {
                        type: "boolean",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_REJECT_UNAUTHORIZED
                    },
                    basePath: {
                        type: "string",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_BASE_PATH
                    },
                    tokenType: {
                        type: "string",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_TOKEN_TYPE
                    },
                    tokenValue: {
                        type: "string",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_TOKEN_VALUE,
                        secure: true
                    }
                },
                required: []
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
                    options: "zos125 --host zos125 --port 1443",
                    description: "Create a zosmf profile called 'zos125' to connect to z/OSMF at the host zos125 and port 1443, " +
                        " not specifying a username or password so they are not stored on disk; these will need to be specified on every command"
                },
                {
                    options: "zos126 --reject-unauthorized false",
                    description: "Create a zosmf profile called 'zos126' to connect to z/OSMF on the default port 443 and allow self-signed certificates, " +
                    "not specifying a username, password, or host so they are not stored on disk; these will need to be specified on every command"
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
            ],
            authConfig: {
                serviceName: "apiml",
                login: {
                    description: AuthConstants.APIML_LOGIN_DESCRIPTION,
                    examples: [AuthConstants.APIML_LOGIN_EXAMPLE],
                    handler: __dirname + "/auth/src/cli/apiml/Login.handler"
                },
                logout: {
                    handler: __dirname + "/auth/src/cli/apiml/Logout.handler"
                }
            }
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
                        optionDefinition: TSO_OPTION_ACCOUNT_PROFILE
                    },
                    characterSet: {
                        type: "string",
                        optionDefinition: TSO_OPTION_CHAR_SET
                    },
                    codePage: {
                        type: "string",
                        optionDefinition: TSO_OPTION_CODE_PAGE
                    },
                    columns: {
                        type: "number",
                        optionDefinition: TSO_OPTION_COLUMNS
                    },
                    logonProcedure: {
                        type: "string",
                        optionDefinition: TSO_OPTION_LOGON_PROCEDURE
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
                    description: "Create a tso profile called 'myprof2' with default settings and region size of 8192, without storing the user account on disk",
                    options: "myprof2 --rs 8192"
                }
            ],
            updateProfileExamples: [
                {
                    description: "Update a tso profile called myprof with new JES accounting information",
                    options: "myprof -a NEWACCT"
                }
            ]
        },
        {
            type: "ssh",
            schema: {
                type: "object",
                title: "z/OS SSH Profile",
                description: "z/OS SSH Profile",
                properties: {
                    host: {
                        type: "string",
                        optionDefinition: SshSession.SSH_OPTION_HOST_PROFILE
                    },
                    port: {
                        type: "number",
                        optionDefinition: SshSession.SSH_OPTION_PORT
                    },
                    user: {
                        type: "string",
                        optionDefinition: SshSession.SSH_OPTION_USER_PROFILE
                    },
                    password: {
                        type: "string",
                        secure: true,
                        optionDefinition: SshSession.SSH_OPTION_PASSWORD
                    },
                    privateKey: {
                        type: "string",
                        optionDefinition: SshSession.SSH_OPTION_PRIVATEKEY
                    },
                    keyPassphrase: {
                        type: "string",
                        secure: true,
                        optionDefinition: SshSession.SSH_OPTION_KEYPASSPHRASE
                    },
                    handshakeTimeout: {
                        type: "number",
                        optionDefinition: SshSession.SSH_OPTION_HANDSHAKETIMEOUT
                    }
                },
                required: []
            },
            createProfileExamples: [
                {
                    options: "ssh111 --host sshhost --user ibmuser --password myp4ss",
                    description: "Create a ssh profile called 'ssh111' to connect to z/OS SSH server at host 'zos123' and default port 22"
                },
                {
                    options: "ssh222 --host sshhost --port 13022 --user ibmuser --password myp4ss",
                    description: "Create a ssh profile called 'ssh222' to connect to z/OS SSH server at host 'zos123' and port 13022"
                },
                {
                    options: "ssh333 --host sshhost --user ibmuser --privateKey /path/to/privatekey --keyPassphrase privateKeyPassphrase",
                    description: "Create a ssh profile called 'ssh333' to connect to z/OS SSH server at host 'zos123' " +
                                 "using a privatekey '/path/to/privatekey' and its decryption passphrase 'privateKeyPassphrase' " +
                                 "for privatekey authentication"
                },
                {
                    options: "ssh444 --privateKey /path/to/privatekey",
                    description: "Create a ssh profile called 'ssh444' to connect to z/OS SSH server on default port 22, without specifying " +
                    "username, host, or password, preventing those values from being stored on disk"
                }
            ]
        }

    ]
};
module.exports = config;
