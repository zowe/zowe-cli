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

import { ICommandDefinition } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";

export const ChangePasswordCommand: ICommandDefinition = {
    name: "change-password",
    aliases: ["chpw"],
    summary: "Change a z/OS password using z/OSMF",
    description: "Change the password or passphrase of a z/OS user ID using the z/OSMF REST API. " +
        "You will be prompted to enter both the current and new password or passphrase. ",
    type: "command",
    handler: __dirname + "/ChangePassword.handler",
    profile: {
        optional: ["zosmf"]
    },
    options: ZosmfSession.ZOSMF_CONNECTION_OPTIONS,
    examples: [
        {
            description: "Change the password or passphrase of the user specified in your default zosmf profile",
            options: ""
        },
        {
            description: "Change the password or passphrase for a specific user",
            options: "--user myuser"
        },
        {
            description: "Change the password or passphrase for a specific user on a specific system",
            options: "--host myhost --port 443 --user myuser"
        }
    ]
};
