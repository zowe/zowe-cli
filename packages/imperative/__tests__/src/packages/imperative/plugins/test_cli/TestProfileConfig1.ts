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

export const TestProfileConfig1: ICommandProfileTypeConfiguration = {
    type: "TestProfile1",
    schema: {
        type: "object",
        title: "The first test profile schema",
        description: "The first test profile description",
        properties: {
            importance: {
                optionDefinition: {
                    description: "The importance of something",
                    type: "string",
                    name: "importance",
                    aliases: ["i"],
                    required: true,
                    defaultValue: "desirable"
                },
                type: "string",
            },
            duration: {
                optionDefinition: {
                    description: "How many days will it last",
                    type: "number",
                    name: "duration",
                    aliases: ["d"],
                    required: false
                },
                type: "number",
            },
        },
        required: ["size", "duration"],
    },
    validationPlanModule: __dirname + "/TestProfileValidationPlan1"
};
