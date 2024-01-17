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

import { Imperative } from "../../../../src/imperative/Imperative";
import { CommandResponse } from "../../../../";

export const WRITE_MESSAGE_ONE: string = "Hello from Command Response Process Message 1 (stdout)";
export const WRITE_MESSAGE_TWO: string = "Hello from Command Response Process Message 2 (stdout)";

export const WRITE_ERR_MESSAGE_ONE: string = "Hello from Command Error Response Process Message 1 (stderr)";
export const WRITE_ERR_MESSAGE_TWO: string = "Hello from Command Error Response Process Message 2 (stderr)";

Imperative.init({
    definitions: [
        {
            name: "test",
            type: "group",
            description: "the group",
            children: [
                {
                    name: "command",
                    type: "command",
                    options: [],
                    description: "the command",
                }],
        }
    ],
    productDisplayName: "Command Response Process",
    defaultHome: process.cwd() + "/.testHomeDir",
    rootCommandDescription: "Command Response Process CLI",
}).then(() => {
    /**
     * Allocate the command response object for the process test
     */
    const cmdResp: CommandResponse = new CommandResponse({
        primaryTextColor: "yellow",
        responseFormat: "default"
    });

    try {
        /**
         * Messages should go to stdout with newlines appended automatically
         */
        cmdResp.console.log(WRITE_MESSAGE_ONE);
        cmdResp.console.log(WRITE_MESSAGE_TWO);

        /**
         * Messages should go to stderr with newlines appended automatically
         */
        cmdResp.console.error(WRITE_ERR_MESSAGE_ONE);
        cmdResp.console.error(WRITE_ERR_MESSAGE_TWO);

        /**
         * Exit with 0 return code
         */
        process.exitCode = 0;
    } catch (e) {
        process.stdout.write("An error occurred in the command response process: " + e.message + "\n");
        process.exitCode = 1;
    }
});
