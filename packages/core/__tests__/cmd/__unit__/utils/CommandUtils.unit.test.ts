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


import { COMPLEX_COMMAND, COMPLEX_COMMAND_WITH_ALIASES, MULTIPLE_GROUPS } from "../../__resources__/CommandDefinitions";
import { inspect } from "util";
import {
    CommandPreparer, CommandUtils, ICommandDefinition, ICommandOptionDefinition, ICommandTreeEntry
} from "../../../../src/cmd";
import { cloneDeep } from "lodash";
import { TestLogger } from "../../../__resources__/src/TestLogger";
// UnitTestUtils.replaceIt();

describe("Command Utils", () => {
    it("We should be able to determine if an option is specified", () => {
        expect(CommandUtils.optionWasSpecified("test-option", {
            name: "test-command",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                }
            ]
        }, {"$0": undefined, "_": undefined, "test-option": "This was specified"})).toEqual(true);
    });

    it("We should be able to build the full command string from the definition and the arguments", () => {
        const expected: string = "maincommand test-group test-command \"value2\" --test-option value1 --test-boolean";
        const preparedCommand: ICommandDefinition = CommandPreparer.prepare(COMPLEX_COMMAND.children[0]);
        const constructed: string = CommandUtils.reconstructCommand({
            "$0": undefined,
            "_": ["test-group", "test-command"],
            "test-option": "value1",
            "positional1": "value2",
            "test-boolean": true
        }, preparedCommand);
        expect(constructed).toEqual(expected);
    });

    it("We should be able to get the option definition from the name", () => {
        const optionName: string = "test-option";
        const option: ICommandOptionDefinition = {
            name: optionName,
            description: "the option",
            type: "string"
        };
        expect(CommandUtils.getOptionDefinitionFromName(optionName, {
            name: "test-command",
            description: "my command",
            type: "command",
            options: [option]
        })).toEqual(option);
    });

    it("We should be able to flatten a nested command tree for display and searching purposes", () => {
        const flatten: ICommandTreeEntry[] = CommandUtils.flattenCommandTree(COMPLEX_COMMAND);
        TestLogger.info("Flattened Command Tree:\n" + inspect(flatten));
        expect(flatten).toMatchSnapshot();
    });

    it("We should be able get the full command name from the flattened tree", () => {
        const fullCommand: string = CommandUtils.getFullCommandName(COMPLEX_COMMAND.children[0], MULTIPLE_GROUPS);
        expect(fullCommand).toMatchSnapshot();
    });

    it("We should not be able get the full command name from the flattened tree 1", () => {
        const child = cloneDeep(COMPLEX_COMMAND.children[0]);
        child.description = "Description mismatch";
        const fullCommand: string = CommandUtils.getFullCommandName(child, MULTIPLE_GROUPS);
        expect(fullCommand).toMatchSnapshot();
    });

    it("We should not be able get the full command name from the flattened tree 2", () => {
        const child = cloneDeep(COMPLEX_COMMAND.children[0]);
        child.aliases = ["mma"];
        const fullCommand: string = CommandUtils.getFullCommandName(child, MULTIPLE_GROUPS);
        expect(fullCommand).toMatchSnapshot();
    });

    it("We should be able to flatten a nested command tree with aliases for display and searching purposes", () => {
        const flatten: ICommandTreeEntry[] = CommandUtils.flattenCommandTreeWithAliases(COMPLEX_COMMAND_WITH_ALIASES);
        TestLogger.info("Flattened Command Tree:\n" + inspect(flatten));
        expect(flatten).toMatchSnapshot();
    });
});
