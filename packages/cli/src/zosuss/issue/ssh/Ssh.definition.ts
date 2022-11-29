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

export const SshDefinition: ICommandDefinition = {
    name: "command",
    aliases: ["cmd", "ssh"],
    description: "Issue a z/OS USS command\n\n" +
                 "Note: The common CLI 'Base Connection Options' of token-type and token-value are not applicable to " +
                 "the ssh command, since the ssh service is not accessible through APIML.",
    handler: __dirname + "/Ssh.handler",
    type: "command",
    positionals: [{
        name: "command",
        description: "z/OS USS command to issue",
        type: "string",
        required: true
    }],
    options: [
        {
            name: "cwd",
            description: "Working directory in which to execute the command",
            type: "string"
        }],
    profile: {
        optional: ["ssh"]
    },
    examples: [{
        description: "Issue a simple command, giving the working directory",
        options: "\"npm install express\" --cwd /u/cicprov/mnt/CICPY01I/bundles/myapp "
    }]
};
