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
import { ZosmfSession } from "../ZosmfSession";
import { ZosFilesOptions } from "./Zosmf.constants";

/**
 * Profile configuration for ZOSMF profiles
 * @type {ICommandProfileTypeConfiguration}
 * @memberof ZosmfProfile
 */
export const ZosmfProfile: ICommandProfileTypeConfiguration =
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
    }
};
