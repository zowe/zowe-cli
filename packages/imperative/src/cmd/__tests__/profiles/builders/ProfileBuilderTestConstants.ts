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

import { ICommandDefinition } from "../../../src/doc/ICommandDefinition";
import { ICommandProfileTypeConfiguration } from "../../../src/profiles/doc/ICommandProfileTypeConfiguration";

export const testBuilderProfiles: ICommandProfileTypeConfiguration[] = [
    {
        type: "type-a",
        schema: {
            title: "Type A profile",
            type: "object",
            description: "Type A profile for builder tests",
            properties: {
                age: {
                    type: "number",
                    optionDefinition: {
                        name: "age",
                        type: "number",
                        description: "The age of the profile"
                    }
                }
            }
        },
        validationPlanModule: "dummy"
    },
    {
        type: "type-b",
        schema: {
            title: "Type B profile",
            type: "object",
            description: "Type B profile for builder tests",
            properties: {
                age: {
                    type: "number",
                    optionDefinition: {
                        name: "legs",
                        type: "number",
                        description: "The number of legs"
                    }
                }
            }
        }
    }
];

/**
 * Delete handlers from a command definition since the absolute path is different per
 * machine
 * @param {ICommandDefinition} command - the definition with the handlers removed
 */
export const deleteHandlerPaths = (command: ICommandDefinition) => {
    command = JSON.parse(JSON.stringify(command)); // copy the command
    delete command.handler;
    const newChildren = [];
    for (const child of command.children || []) {
        newChildren.push(deleteHandlerPaths(child));
    }
    command.children = newChildren;
    return command;
};
