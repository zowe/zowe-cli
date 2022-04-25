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
import { AUTH_GROUP_DESCRIPTION, AUTH_GROUP_SUMMARY, BaseProfile } from "@zowe/core-for-zowe-sdk";

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
    baseProfile: BaseProfile,
    authGroupConfig: {
        authGroup: {
            summary: AUTH_GROUP_SUMMARY,
            description: AUTH_GROUP_DESCRIPTION
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
        ZosmfProfile,
        ZosTsoProfile,
        ZosUssProfile
    ]
};
module.exports = config;
