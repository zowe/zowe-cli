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

import { ICommandProfileTypeConfiguration } from "@zowe/core-for-zowe-sdk";

export const TestProfileConfig2: ICommandProfileTypeConfiguration = {
    type: "TestProfile2",
    schema: {
        type: "object",
        title: "The Second test profile schema",
        description: "The Second test profile description",
        properties: {
            port: {
                optionDefinition: {
                    description: "Some port number",
                    type: "number",
                    name: "port",
                    aliases: ["p"],
                    required: true
                },
                type: "number",
            }
        },
        required: ["port"],
    }
};
