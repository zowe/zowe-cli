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
            options: "zosAPIML --host zosAPIML --port 7554 --user ibmuser --password myp4ss --reject-unauthorized false --base-path ibmzosmf/api/v1",
            description: "Create a zosmf profile called 'zosAPIML' to connect to z/OSMF via the Zowe API Mediation Layer running at host " +
                "'zosAPIML', port '7554', and allow for self-signed certificates. To reduce duplication, you could elect to store the 'host', " +
                "'port', 'reject-unauthorized', 'user', and 'password' values for the API Mediation Layer in a base profile and only store the " +
                "'base-path' of the service in the zosmf profile."
        }
    ],
    updateProfileExamples: [
        {
            options: "zos123 --user newuser --password newp4ss",
            description: "Update a zosmf profile named 'zos123' with a new username and password"
        }
    ]
};
