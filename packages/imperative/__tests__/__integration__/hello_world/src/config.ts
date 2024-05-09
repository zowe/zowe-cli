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

import { IImperativeConfig } from "../../../../lib/index";

const config: IImperativeConfig = {
    definitions: [
        {
            name: "hello",
            description: "The hello command will respond with 'World!'.",
            summary: "The hello command",
            type: "command",
            handler: __dirname + "/handler"
        }
    ],
    rootCommandDescription: "The Hello World! CLI. Say hello to the world!",
    defaultHome: "~/.hello-world-cli",
    productDisplayName: "Hello World CLI!",
    primaryTextColor: "blue",
    envVariablePrefix: "CMD_CLI",
    name: "hello-world-cli",
    secondaryTextColor: "yellow",
    progressBarSpinner: ".oO0Oo.",
    allowConfigGroup: false,
    allowPlugins: false
};


module.exports = config;
