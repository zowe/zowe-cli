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

import { IImperativeConfig } from "../../../../../src/imperative/doc/IImperativeConfig";

const config: IImperativeConfig = {
    definitions: [
        {
            name: "mock group name",
            description: "mock group description",
            type: "group",
            children: [
                {
                    name: "mock command name",
                    description: "mock command description",
                    type: "command",
                    handler: __dirname + "/../commands/pick/PickPineappleHandler"
                }
            ]
        }
    ],
    commandModuleGlobs: ["**/Definition.js"],
    rootCommandDescription: "mock root description",
    defaultHome: "~/.sample-cli",
    productDisplayName: "Sample CLI",
    primaryTextColor: "blue",
    name: "mock config name",
};

export = config;