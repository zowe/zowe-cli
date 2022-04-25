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

import { IImperativeConfig } from "@zowe/imperative";
import { Constants } from "./Constants";
import { ZosFilesOptions } from "./zosfiles/ZosFiles.options";

import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { ZosTsoProfile } from "@zowe/zos-tso-for-zowe-sdk";
import { ZosUssProfile } from "@zowe/zos-uss-for-zowe-sdk";

const config: IImperativeConfig = {
    productDisplayName: Constants.DISPLAY_NAME,
    commandModuleGlobs: [
        "daemon/*.definition!(.d).*s",
        "provisioning/*.definition!(.d).*s",
        "workflows/*.definition!(.d).*s",
        "zosconsole/*.definition!(.d).*s",
        "zosfiles/*.definition!(.d).*s",
        "zosjobs/*.definition!(.d).*s",
        "zosmf/*.definition!(.d).*s",
        "zostso/*.definition!(.d).*s",
        "zosuss/*.definition!(.d).*s",
        "zoslogs/*.definition!(.d).*s"
    ],
    rootCommandDescription: Constants.DESCRIPTION,
    defaultHome: Constants.HOME_DIR,
    envVariablePrefix: Constants.ENV_PREFIX,
    webHelpLogoImgPath: path.join(__dirname, "..", "web-help-logo.png"),
    logging: {
        appLogging: {
            logFile: Constants.LOG_LOCATION
        }
    },
    apimlConnLookup: [
        {
            apiId: "ibm.zosmf",
            gatewayUrl: "api/v1",
            connProfType: "zosmf"
        }
    ],
    baseProfile: {
        type: "base",
        schema: {
            type: "object",
            title: "Base Profile",
            description: "Base profile that stores values shared by multiple service profiles",
            properties: {
                host: {
                    type: "string",
                    optionDefinition: Constants.BASE_OPTION_HOST,
                    includeInTemplate: true
                },
                port: {
                    type: "number",
                    optionDefinition: Constants.BASE_OPTION_PORT
                },
                user: {
                    type: "string",
                    secure: true,
                    optionDefinition: Constants.BASE_OPTION_USER,
                    includeInTemplate: true
                },
                password: {
                    type: "string",
                    secure: true,
                    optionDefinition: Constants.BASE_OPTION_PASSWORD,
                    includeInTemplate: true
                },
                rejectUnauthorized: {
                    type: "boolean",
                    optionDefinition: Constants.BASE_OPTION_REJECT_UNAUTHORIZED,
                    includeInTemplate: true
                },
                tokenType: {
                    type: "string",
                    optionDefinition: Constants.BASE_OPTION_TOKEN_TYPE
                },
                tokenValue: {
                    type: "string",
                    secure: true,
                    optionDefinition: Constants.BASE_OPTION_TOKEN_VALUE
                },
                certFile: {
                    type: "string",
                    optionDefinition: Constants.BASE_OPTION_CERT_FILE
                },
                certKeyFile: {
                    type: "string",
                    optionDefinition: Constants.BASE_OPTION_CERT_KEY_FILE
                // },
                // certFilePassphrase: {
                //     type: "string",
                //     secure: true,
                //     optionDefinition: Constants.BASE_OPTION_CERT_FILE_PASSPHRASE
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
        ],
        authConfig: [
            {
                serviceName: "apiml",
                handler: __dirname + "/auth/ApimlAuthHandler",
                login: {
                    summary: Constants.APIML_LOGIN_SUMMARY,
                    description: Constants.APIML_LOGIN_DESCRIPTION,
                    examples: [
                        Constants.APIML_LOGIN_EXAMPLE1,
                        Constants.APIML_LOGIN_EXAMPLE2
                    ],
                    options: [
                        Constants.BASE_OPTION_HOST,
                        Constants.BASE_OPTION_PORT,
                        Constants.BASE_OPTION_USER,
                        Constants.BASE_OPTION_PASSWORD,
                        Constants.BASE_OPTION_REJECT_UNAUTHORIZED,
                        Constants.BASE_OPTION_CERT_FILE,
                        Constants.BASE_OPTION_CERT_KEY_FILE
                    ]
                },
                logout: {
                    summary: Constants.APIML_LOGOUT_SUMMARY,
                    description: Constants.APIML_LOGOUT_DESCRIPTION,
                    examples: [
                        Constants.APIML_LOGOUT_EXAMPLE1,
                        Constants.APIML_LOGOUT_EXAMPLE2
                    ],
                    options: [
                        Constants.BASE_OPTION_HOST,
                        Constants.BASE_OPTION_PORT,
                        Constants.APIML_LOGOUT_OPTION_TOKEN_TYPE,
                        Constants.BASE_OPTION_TOKEN_VALUE,
                        Constants.BASE_OPTION_REJECT_UNAUTHORIZED
                    ]
                }
            }
        ]
    },
    authGroupConfig: {
        authGroup: {
            summary: Constants.AUTH_GROUP_SUMMARY,
            description: Constants.AUTH_GROUP_DESCRIPTION
        }
    },
    configAutoInitCommandConfig: {
        handler: __dirname + "/config/auto-init/ApimlAutoInitHandler",
        provider: "APIML",
        autoInit: {
            options: [
                Constants.AUTO_INIT_OPTION_HOST,
                Constants.AUTO_INIT_OPTION_PORT,
                Constants.AUTO_INIT_OPTION_USER,
                Constants.AUTO_INIT_OPTION_PASSWORD,
                Constants.AUTO_INIT_OPTION_REJECT_UNAUTHORIZED,
                Constants.AUTO_INIT_OPTION_TOKEN_TYPE,
                Constants.AUTO_INIT_OPTION_TOKEN_VALUE
            ]
        },
        profileType: "base"
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
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_HOST
                    },
                    port: {
                        type: "number",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_PORT,
                        includeInTemplate: true
                    },
                    user: {
                        type: "string",
                        secure: true,
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_USER
                    },
                    password: {
                        type: "string",
                        secure: true,
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_PASSWORD
                    },
                    rejectUnauthorized: {
                        type: "boolean",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_REJECT_UNAUTHORIZED
                    },
                    certFile: {
                        type: "string",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_CERT_FILE
                    },
                    certKeyFile: {
                        type: "string",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_CERT_KEY_FILE
                    },
                    // certFilePassphrase: {
                    //     type: "string",
                    //     secure: true,
                    //     optionDefinition: ZosmfSession.ZOSMF_OPTION_CERT_FILE_PASSPHRASE
                    // },
                    basePath: {
                        type: "string",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_BASE_PATH
                    },
                    protocol: {
                        type: "string",
                        optionDefinition: ZosmfSession.ZOSMF_OPTION_PROTOCOL
                    },
                    encoding: {
                        type: "string",
                        optionDefinition: {
                            name: "encoding",
                            aliases: ["ec"],
                            description: "The encoding for download and upload of z/OS data set and USS files." +
                                " The default encoding if not specified is IBM-1047.",
                            type: "string"
                        }
                    },
                    responseTimeout: {
                        type: "number",
                        optionDefinition: ZosFilesOptions.responseTimeout
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
                    description: "Create a zosmf profile called 'zos126' to connect to z/OSMF on the default port 443 and allow self-signed " +
                        "certificates, not specifying a username, password, or host so they are not stored on disk; these will need to be " +
                        "specified on every command"
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
        ZosTsoProfile,
        ZosUssProfile
    ]
};
module.exports = config;
