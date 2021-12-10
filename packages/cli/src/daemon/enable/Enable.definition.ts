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

export const EnableCommand: ICommandDefinition = {
    name: "enable",
    description: "Enables daemon-mode operation of the Zowe-CLI. " +
        "You only need to run the enable command once after each " +
        "new installation of the Zowe-CLI. Afterwards, any zowe command " +
        "will automatically start a daemon as needed.",
    type: "command",
    handler: __dirname + "/Enable.handler",
    examples: [
        {
            description: "Enable daemon-mode",
            options: ""
        }
    ]
};
