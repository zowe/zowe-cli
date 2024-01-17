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

export const JSON_WRITE_ERROR_MESSAGE_ONE: string = "Hello from Command Response JSON Process Message 1 (stderr)";
export const JSON_WRITE_ERROR_MESSAGE_TWO: string = "Hello from Command Response JSON Process Message 2 (stderr)";
export const JSON_ERROR_PROCESS_API_MSG: string = "We failed and we are sorry.";

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
        silent: true,
        responseFormat: "json"
    });

    try {
        /**
         * Messages should go to stderr with newlines appended automatically
         */
        cmdResp.console.error(JSON_WRITE_ERROR_MESSAGE_ONE);
        cmdResp.console.error(JSON_WRITE_ERROR_MESSAGE_TWO);
        cmdResp.data.setMessage(JSON_ERROR_PROCESS_API_MSG);
        cmdResp.data.setObj({test: "object"});
        cmdResp.setError({
            msg: "an error occurred."
        });
        cmdResp.failed();
        cmdResp.writeJsonResponse();
        /**
         * Exit with 0 return code
         */
        process.exitCode = 0;
    } catch (e) {
        process.stdout.write("An error occurred in the command response process: " + e.message + "\n");
        process.exitCode = 1;
    }
});
