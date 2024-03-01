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
import { SshSession } from "../SshSession";

/**
 * Profile configuration for SSH profiles
 * @type {ICommandProfileTypeConfiguration}
 * @memberof ZosUssProfile
 */
export const ZosUssProfile: ICommandProfileTypeConfiguration = {
    type: "ssh",
    schema: {
        type: "object",
        title: "z/OS SSH Profile",
        description: "z/OS SSH Profile",
        properties: {
            host: {
                type: "string",
                optionDefinition: SshSession.SSH_OPTION_HOST
            },
            port: {
                type: "number",
                optionDefinition: SshSession.SSH_OPTION_PORT,
                includeInTemplate: true
            },
            user: {
                type: "string",
                secure: true,
                optionDefinition: SshSession.SSH_OPTION_USER
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
    }
};
