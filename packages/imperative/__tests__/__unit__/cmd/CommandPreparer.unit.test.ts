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

import { ICommandDefinition } from "../../../src/cmd/doc/ICommandDefinition";
import { CommandPreparer } from "../../../src/cmd/CommandPreparer";
import { TestLogger } from "../../../__tests__/src/TestLogger";
import { inspect } from "util";
import {
    MULTIPLE_GROUPS,
    PASS_ON_MULTIPLE_GROUPS,
    SUPPRESS_OPTION_MULTIPLE_GROUPS,
    VALID_COMPLEX_COMMAND,
    VALIDATE_MULTIPLE_GROUPS,
    ORIGINAL_DEFINITIONS,
    VALID_COMMANDS_WITH_PROFILES,
    SAMPLE_BASE_PROFILE
} from "./__resources__/CommandDefinitions";
import { ImperativeError } from "../../error/src/ImperativeError";

// UnitTestUtils.replaceIt();

describe("Command Preparer", () => {
    it("should prepare the final command document for imperative usage", () => {
        ORIGINAL_DEFINITIONS.forEach((test) => {
            const prepared: ICommandDefinition = CommandPreparer.prepare(test);
            TestLogger.getTestLogger().debug("Prepared command definition:");
            TestLogger.getTestLogger().debug("\n" + inspect(prepared, {showHidden: true, depth: null}));
            expect(prepared).toMatchSnapshot();
        });
    });

    it("should be able to generate profile options (and suppress if desired)", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(SUPPRESS_OPTION_MULTIPLE_GROUPS));
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to generate options for base profile fields", () => {
        VALID_COMMANDS_WITH_PROFILES.forEach((test) => {
            const newDef: ICommandDefinition = JSON.parse(JSON.stringify(test));
            const prepared: ICommandDefinition = CommandPreparer.prepare(newDef, SAMPLE_BASE_PROFILE);
            TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
            expect(prepared).toMatchSnapshot();
        });
    });

    it("should be able to pass on (and overwrite) profile attributes from parents to children", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "profile",
            value: {
                required: ["banana"]
            }
        }];
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to pass on (and overwrite) enableStdin settings", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "enableStdin",
            value: true
        }];
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to pass on profile attributes from parents to children except children of a certain name", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "profile",
            value: {
                required: ["banana"]
            },
            ignoreNodes: [
                {
                    name: "test-command-child3"
                }
            ]
        }];
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to pass on attributes from parents to children and not erroneously ignore nodes", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "profile",
            value: {
                required: ["banana"]
            },
            ignoreNodes: [
                {
                    name: "test-command-child3",
                    type: "group"
                }
            ]
        }];
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to pass on attributes from parents to children and ignore definitions with type group", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "profile",
            value: {
                required: ["banana"]
            },
            ignoreNodes: [
                {
                    type: "group"
                }
            ]
        }];
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to ignore everything if specified", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "profile",
            value: {
                required: ["banana"]
            },
            ignoreNodes: [
                {
                    type: "group"
                },
                {
                    type: "command"
                }
            ]
        }];
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to pass on new options to children (and merge them)", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "options",
            value: [
                {
                    name: "new-option",
                    type: "string",
                    description: "This is a passed down option"
                }
            ],
            merge: true
        }];
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to pass on new options to children, merge them, but ignore groups", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "options",
            value: [
                {
                    name: "new-option",
                    type: "string",
                    description: "This is a passed down option"
                }
            ],
            merge: true,
            ignoreNodes: [
                {
                    type: "group"
                }
            ]
        }];
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to detect if a undefined or null attribute is being passed down (error)", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "stdinOptionDescription",
        }];
        try {
            const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toMatchSnapshot();
        }
    });

    it("should be able to pass on options of a parent to children", () => {
        const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        newDef.passOn = [{
            property: "options",
            merge: true
        }];
        const prepared: ICommandDefinition = CommandPreparer.prepare(newDef);
        TestLogger.info("\n\n" + inspect(prepared, {showHidden: true, depth: null}));
        expect(prepared).toMatchSnapshot();
    });

    it("should be able to detect groups with undefined children", () => {
        try {
            const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete newDef.children;
            CommandPreparer.validateDefinitionTree(newDef);
            expect(0).toBe(1);
        } catch (e) {
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toMatchSnapshot();
        }
    });

    it("should be able to detect groups with no children", () => {
        try {
            const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            newDef.children = [];
            CommandPreparer.validateDefinitionTree(newDef);
            expect(0).toBe(1);
        } catch (e) {
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toMatchSnapshot();
        }
    });

    it("should be able to detect a command with both a handler and chained handlers", () => {
        let error: ImperativeError;
        try {
            const newDef: ICommandDefinition = {
                name: "test",
                description: "test",
                type: "command",
                handler: "test",
                chainedHandlers: [{
                    handler: "test",
                }],
            };
            CommandPreparer.validateDefinitionTree(newDef);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined(); // should have encountered an error
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should be able to detect if a chained handlers index is out of bounds", () => {
        let error: ImperativeError;
        try {
            const newDef: ICommandDefinition = {
                name: "test",
                description: "test",
                type: "command",
                chainedHandlers: [{
                    handler: "test",
                    mapping: [
                        {
                            from: "test.value",
                            to: "hello",
                            applyToHandlers: [2]
                        }
                    ]
                }],
            };
            CommandPreparer.validateDefinitionTree(newDef);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined(); // should have encountered an error
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.additionalDetails).toContain("index");
        expect(error.additionalDetails).toContain("2");
    });


    it("should be able to detect if a chained handler mapping has no 'to' field", () => {
        let error: Error;
        try {
            const newDef: ICommandDefinition = {
                name: "test",
                description: "test",
                type: "command",
                chainedHandlers: [{
                    handler: "test",
                    mapping: [
                        {
                            from: "this.one.is.normal",
                            to: "hello",
                            applyToHandlers: [0]
                        },
                        {
                            from: "test.value",
                            applyToHandlers: [0]
                        } as any // no 'to' field
                    ]
                }],
            };
            CommandPreparer.validateDefinitionTree(newDef);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined(); // should have encountered an error
        expect(error instanceof ImperativeError).toBe(true);
        expect(JSON.stringify(error)).toContain("'to'");
    });


    it("should be able to detect if a chained handler mapping has both a 'from' field and a 'value' field", () => {
        let error: Error;
        try {
            const newDef: ICommandDefinition = {
                name: "test",
                description: "test",
                type: "command",
                chainedHandlers: [{
                    handler: "test",
                    mapping: [
                        {
                            from: "from.field",
                            value: "value too",
                            to: "hello"
                        },
                    ]
                }],
            };
            CommandPreparer.validateDefinitionTree(newDef);
            expect(0).toBe(1);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined(); // should have encountered an error
        expect(error instanceof ImperativeError).toBe(true);
        expect(JSON.stringify(error)).toContain("from");
        expect(JSON.stringify(error)).toContain("value");
    });


    it("should be able to detect children that are ill-formed", () => {
        try {
            const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            (newDef.children as any) = {not: "correct"};
            CommandPreparer.validateDefinitionTree(newDef);
            expect(0).toBe(1);
        } catch (e) {
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toMatchSnapshot();
        }
    });

    it("should be able to detect definition nodes with missing type", () => {
        try {
            const newDef: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete newDef.type;
            CommandPreparer.validateDefinitionTree(newDef);
            expect(0).toBe(1);
        } catch (e) {
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toMatchSnapshot();
        }
    });

    it("should be able to detect documents with missing descriptions", () => {
        try {
            CommandPreparer.validateDefinitionTree(VALIDATE_MULTIPLE_GROUPS);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`undefined or empty description`);
        }
    });

    it("should be able to detect documents with circular references", () => {
        try {
            MULTIPLE_GROUPS.children.push(MULTIPLE_GROUPS);
            CommandPreparer.prepare(MULTIPLE_GROUPS);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`error occurred copying the original command document`);
        }
    });

    it("should be able to detect definitions without a name at the top level", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete cmd.name;
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`A command definition node contains an undefined or empty name.`);
        }
    });

    it("should be able to detect definitions without a name at a lower level", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete cmd.children[0].name;
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`A command definition node contains an undefined or empty name.`);
        }
    });

    it("should be able to detect null or undefined definitions", () => {
        try {
            CommandPreparer.prepare(null);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`The command definition document must not be null/undefined.`);
        }
    });

    it("should be able to detect options that are not an array", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            (cmd.options as any) = {};
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`options are invalid (not an array).`);
        }
    });

    it("should be able to detect options that are null", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            (cmd.options as any) = [null];
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`option definition is null or undefined`);
        }
    });

    it("should be able to detect options that are undefined", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            (cmd.options as any) = [undefined];
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`option definition is null or undefined`);
        }
    });

    it("should be able to group required profile options, if specified", () => {
        const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
        cmd.options = [
            {
                name: "test-option",
                description: "Used to test command def. checks",
                group: undefined,
                required: true,
                type: "string"
            }
        ];

        const cmdDef = CommandPreparer.prepare(cmd);
        const cmdOpts = cmdDef.options;
        expect(cmdOpts).not.toBe(undefined);
        expect(cmdOpts[0]?.group).toBe("Required Options");
    });

    it("should be able to detect positionals that are not an array", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            (cmd.positionals as any) = {};
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`positionals are invalid (not an array).`);
        }
    });

    it("should be able to detect that a definition is valid", () => {
        try {
            CommandPreparer.prepare(VALID_COMPLEX_COMMAND);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(0).toBe(1);
        }
    });

    it("should be able to detect if an option has no name", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete cmd.children[0].children[0].options[0].name;
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`An option definition contains an undefined or empty name.`);
        }
    });

    it("should be able to detect if an option has no type", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete cmd.children[0].children[0].options[0].type;
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`An option definition`);
            expect(e.message).toContain(`contains an undefined or empty type.`);
        }
    });

    it("should be able to detect if an option has no description", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete cmd.children[0].children[0].options[0].description;
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`An option definition`);
            expect(e.message).toContain(`undefined or empty description`);
        }
    });

    it("should be able to detect if a positional has no name", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete cmd.children[0].children[0].positionals[0].name;
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`A positional definition contains an undefined or empty name.`);
        }
    });

    it("should be able to detect if a positional has no type", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete cmd.children[0].children[0].positionals[0].type;
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`A positional definition`);
            expect(e.message).toContain(`contains an undefined or empty type.`);
        }
    });

    it("should be able to detect if a positional has no description", () => {
        try {
            const cmd: ICommandDefinition = JSON.parse(JSON.stringify(PASS_ON_MULTIPLE_GROUPS));
            delete cmd.children[0].children[0].positionals[0].description;
            CommandPreparer.prepare(cmd);
            expect(0).toBe(1);
        } catch (e) {
            TestLogger.info(e.message);
            expect(e instanceof ImperativeError).toBe(true);
            expect(e.message).toContain(`A positional definition`);
            expect(e.message).toContain(`undefined or empty description`);
        }
    });

    it("should mark parent commands that have all experimental children as experimental", () => {
        const cmd: ICommandDefinition = {
            name: "parent",
            type: "group",
            description: "my parent command",
            children: [
                {
                    name: "exp-child1",
                    description: "experimental child 1",
                    type: "command",
                    experimental: true
                },
                {
                    name: "exp-child2",
                    description: "experimental child 1",
                    type: "command",
                    experimental: true
                }
            ]
        };
        const prepared = CommandPreparer.prepare(cmd);
        expect(prepared.experimental).toEqual(true);
    });

    it("should mark not parent commands that have mixed experimental " +
        "and non-experimental children as experimental", () => {
        const cmd: ICommandDefinition = {
            name: "parent",
            type: "group",
            description: "my parent command",
            children: [
                {
                    name: "exp-child1",
                    description: "experimental child 1",
                    type: "command",
                    experimental: true
                },
                {
                    name: "exp-child2",
                    description: "experimental child 1",
                    type: "command",
                    experimental: false
                }
            ]
        };
        const prepared = CommandPreparer.prepare(cmd);
        expect(prepared.experimental).toBeUndefined();
    });

    it("should append the auto-format options if requested", () => {
        const cmd: ICommandDefinition = {
            name: "fake",
            type: "command",
            description: "my parent command",
            outputFormatOptions: true
        };
        const prepared = CommandPreparer.prepare(cmd);
        expect(prepared).toMatchSnapshot();
    });

    it("should mark all children of an experimental group as experimental", () => {
        const cmd: ICommandDefinition = {
            name: "parent",
            type: "group",
            description: "my parent command",
            experimental: true,
            children: [
                {
                    name: "child1",
                    description: "child 1",
                    type: "command",
                },
                {
                    name: "child2",
                    description: " child 1",
                    type: "command",
                },
                {
                    name: "has-grandchildren",
                    description: "has grand children",
                    type: "group",
                    children: [
                        {
                            name: "child1",
                            description: "child 1",
                            type: "command",
                        },
                        {
                            name: "child2",
                            description: " child 1",
                            type: "command",
                        },
                        {
                            name: "has-great-grandchildren",
                            description: "has great grand children",
                            type: "group",
                            children: [
                                {
                                    name: "child1",
                                    description: "child 1",
                                    type: "command",
                                },
                                {
                                    name: "child2",
                                    description: " child 1",
                                    type: "command",
                                },
                            ]
                        },
                    ]
                }
            ]
        };
        const prepared = CommandPreparer.prepare(cmd);
        const expectAllCommandsToBeExperimental = (checkCmd: ICommandDefinition) => {
            if (checkCmd.children != null) {
                for (const child of checkCmd.children) {
                    expect(child.experimental).toEqual(true);
                    expectAllCommandsToBeExperimental(child);
                }
            }
        };
        expectAllCommandsToBeExperimental(prepared);
    });
});
