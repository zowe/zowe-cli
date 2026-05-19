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

import { ZosmfProfile } from "@zowe/zosmf-for-zowe-sdk";
import { ZosTsoProfile } from "@zowe/zos-tso-for-zowe-sdk";
import { ZosUssProfile } from "@zowe/zos-uss-for-zowe-sdk";
import { ProfileConstants } from "@zowe/core-for-zowe-sdk";

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
        ...ProfileConstants.BaseProfile,
        authConfig: [
            {
                serviceName: "apiml",
                handler: __dirname + "/auth/ApimlAuthHandler",
                login: {
                    summary: ProfileConstants.APIML_LOGIN_SUMMARY,
                    description: ProfileConstants.APIML_LOGIN_DESCRIPTION,
                    examples: [
                        ProfileConstants.APIML_LOGIN_EXAMPLE1,
                        ProfileConstants.APIML_LOGIN_EXAMPLE2
                    ],
                    options: [
                        ProfileConstants.BASE_OPTION_HOST,
                        ProfileConstants.BASE_OPTION_PORT,
                        ProfileConstants.BASE_OPTION_USER,
                        ProfileConstants.BASE_OPTION_PASSWORD,
                        ProfileConstants.BASE_OPTION_REJECT_UNAUTHORIZED,
                        ProfileConstants.BASE_OPTION_CERT_FILE,
                        ProfileConstants.BASE_OPTION_CERT_KEY_FILE
                    ]
                },
                logout: {
                    summary: ProfileConstants.APIML_LOGOUT_SUMMARY,
                    description: ProfileConstants.APIML_LOGOUT_DESCRIPTION,
                    examples: [
                        ProfileConstants.APIML_LOGOUT_EXAMPLE1,
                        ProfileConstants.APIML_LOGOUT_EXAMPLE2
                    ],
                    options: [
                        ProfileConstants.BASE_OPTION_HOST,
                        ProfileConstants.BASE_OPTION_PORT,
                        ProfileConstants.APIML_LOGOUT_OPTION_TOKEN_TYPE,
                        ProfileConstants.BASE_OPTION_TOKEN_VALUE,
                        ProfileConstants.BASE_OPTION_REJECT_UNAUTHORIZED
                    ]
                }
            }
        ]
    },
    authGroupConfig: {
        authGroup: {
            summary: ProfileConstants.AUTH_GROUP_SUMMARY,
            description: ProfileConstants.AUTH_GROUP_DESCRIPTION
        }
    },
    configAutoInitCommandConfig: {
        handler: __dirname + "/config/auto-init/ApimlAutoInitHandler",
        provider: "APIML",
        autoInit: {
            options: [
                ProfileConstants.AUTO_INIT_OPTION_HOST,
                ProfileConstants.AUTO_INIT_OPTION_PORT,
                ProfileConstants.AUTO_INIT_OPTION_USER,
                ProfileConstants.AUTO_INIT_OPTION_PASSWORD,
                ProfileConstants.AUTO_INIT_OPTION_REJECT_UNAUTHORIZED,
                ProfileConstants.AUTO_INIT_OPTION_TOKEN_TYPE,
                ProfileConstants.AUTO_INIT_OPTION_TOKEN_VALUE,
                ProfileConstants.AUTO_INIT_OPTION_CERT_FILE,
                ProfileConstants.AUTO_INIT_OPTION_CERT_KEY_FILE
            ]
        },
        profileType: "base"
    },
    profiles: [
        ZosmfProfile,
        ZosTsoProfile,
        ZosUssProfile
    ]
};
module.exports = config;
