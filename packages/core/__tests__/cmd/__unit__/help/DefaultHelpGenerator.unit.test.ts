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

jest.mock("../../../imperative/src/Imperative");
jest.mock("../../../utilities/src/ImperativeConfig");

import {
    DefaultHelpGenerator, ICommandDefinition, ICommandOptionDefinition, IHelpGeneratorFactoryParms,
    ImperativeConfig, ImperativeError
} from "../../../../src";

const chalkColor: string = "blue";
const oldForceColorOption = process.env.FORCE_COLOR;

const LOREM: string = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, " +
    "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, " +
    "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. " +
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat " +
    "nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia " +
    "deserunt mollit anim id est laborum.";

describe("Default Help Generator", () => {
    beforeAll(async () => {
        process.env.FORCE_COLOR = "0";
    });
    afterAll(() => {
        process.env.FORCE_COLOR = oldForceColorOption;
    }
    );
    const GENERATOR_PARMS: IHelpGeneratorFactoryParms = {
        primaryHighlightColor: chalkColor,
        rootCommandName: "test-help",
        produceMarkdown: false
    };

    const PARMS_GENERATE_MARKDOWN: IHelpGeneratorFactoryParms = {
        primaryHighlightColor: chalkColor,
        rootCommandName: "test-help",
        produceMarkdown: true
    };

    const EXAMPLE_APPLE_OPTION: ICommandOptionDefinition = {
        name: "is-apple-tasty",
        aliases: ["iat"],
        description: "Boolean option. " + LOREM,
        type: "boolean",
        required: true,
        defaultValue: false
    };

    const EXAMPLE_STRAWBERRY_OPTION: ICommandOptionDefinition = {
        name: "describe-strawberry",
        aliases: ["ds"],
        description: "String option. " + LOREM,
        type: "string",
        defaultValue: "The best fruit",
    };

    const EXAMPLE_PICK_OPTION: ICommandOptionDefinition = {
        name: "pick-a-fruit",
        description: "Allowable options. " + LOREM,
        type: "string",
        allowableValues: {
            values: ["apple", "strawberry"]
        }
    };

    const EXAMPLE_COMMAND: ICommandDefinition = {
        name: "an-example-command",
        aliases: ["aec"],
        type: "command",
        description: "This is an example command for help generation. " + LOREM,
        options: [EXAMPLE_APPLE_OPTION,
            EXAMPLE_STRAWBERRY_OPTION,
            EXAMPLE_PICK_OPTION]
    };

    const EXAMPLE_EXPERIMENTAL_COMMAND: ICommandDefinition = {
        name: "an-experimental-command",
        aliases: ["axc"],
        type: "command",
        description: "This is an example command marked experimental for help generation. " + LOREM,
        options: [EXAMPLE_APPLE_OPTION,
            EXAMPLE_STRAWBERRY_OPTION,
            EXAMPLE_PICK_OPTION],
        experimental: true
    };

    const COMMAND_WITH_MARKDOWN_SPECIAL_CHRACTERS: ICommandDefinition = {
        name: "an-example-command",
        aliases: ["aec"],
        type: "command",
        description: "This is a command with Markdown special characters in the description # * -. " + LOREM,
        options: [EXAMPLE_APPLE_OPTION,
            EXAMPLE_STRAWBERRY_OPTION,
            EXAMPLE_PICK_OPTION]
    };

    const EXAMPLE_TREE: ICommandDefinition = {
        name: "example-group",
        aliases: ["eg"],
        type: "group",
        description: "This is an example tree group with multiple children",
        summary: "The example tree",
        children: [EXAMPLE_COMMAND,
            EXAMPLE_EXPERIMENTAL_COMMAND]
    };

    const deprecatedGroup: ICommandDefinition = {
        name: "deprecated-group",
        deprecatedReplacement: "Use a better group",
        aliases: ["dg"],
        type: "group",
        description: "This is an example deprecated group with deprecated children",
        summary: "The deprecated tree",
        children: [
            {
                name: "deprecated-command-one",
                deprecatedReplacement: "Use a better command than dc1",
                aliases: ["dc1"],
                type: "command",
                description: "Our first deprecated command.",
                options: [EXAMPLE_APPLE_OPTION,
                    EXAMPLE_STRAWBERRY_OPTION,
                    EXAMPLE_PICK_OPTION]
            },
            {
                name: "not-deprecated-command",
                aliases: ["ndc"],
                type: "command",
                description: "Our non-deprecated command.",
                options: [EXAMPLE_APPLE_OPTION,
                    EXAMPLE_STRAWBERRY_OPTION,
                    EXAMPLE_PICK_OPTION]
            },
            {
                name: "deprecated-command-two",
                deprecatedReplacement: "Use a better command than dc2",
                aliases: ["dc2"],
                type: "command",
                description: "Our second deprecated command.",
                options: [EXAMPLE_APPLE_OPTION,
                    EXAMPLE_STRAWBERRY_OPTION,
                    EXAMPLE_PICK_OPTION]
            }
        ]
    };

    const definition: ICommandDefinition =
        {
            name: "hello",
            type: "command",
            options: [
                {
                    name: "aReaLOption",
                    description: "Part of must specify one group",
                    type: "boolean"
                },
                {
                    name: "elmo",
                    description: "Part of must specify one group",
                    type: "boolean",
                    implies: ["implied-by-2"]
                },
            ],
            description: "my command"
        };

    const hiddenOptionDefinition: ICommandDefinition =
        {
            name: "hello",
            type: "command",
            options: [
                {
                    name: "aHiddenOption",
                    description: "Part of must specify one group",
                    type: "boolean",
                    hidden: true
                },
            ],
            description: "my command"
        };

    const experimentalDefinition: ICommandDefinition =
        {
            name: "hello",
            type: "command",
            positionals: [
                {
                    name: "positional_argument",
                    required: true,
                    type: "number",
                    description: "the number of the day is..."
                }
            ],
            options: [
                {
                    name: "aReaLOption",
                    description: "Part of must specify one group",
                    aliases: ["aro", "real"],
                    type: "boolean"
                },
                {
                    name: "aRequiredOption",
                    description: "Part of must specify one group",
                    required: true,
                    type: "string"
                },
                {
                    name: "elmo",
                    description: "Part of must specify one group",
                    type: "boolean",
                    implies: ["implied-by-2"]
                },
            ],
            description: "my command",
            experimental: true
        };

    const commandChildren: ICommandDefinition = {
        name: "child",
        type: "group",
        children: [experimentalDefinition],
        description: "my_command_child",
        experimental: true
    };

    const fakeParent: ICommandDefinition = {
        name: "a_parent",
        description: "", type: "group",
        children: [definition]
    };

    const expParent: ICommandDefinition = {
        name: "a_experimental_parent",
        description: "", type: "group",
        children: [experimentalDefinition]
    };

    const compoundParent: ICommandDefinition = {
        name: "a_experimental_parent",
        description: "", type: "group",
        children: [fakeParent, experimentalDefinition]
    };

    const badDefinitionType: ICommandDefinition = {
        name: "bad_parent",
        description: "", type: "notexist",
        children: [fakeParent, experimentalDefinition]
    } as any;

    const undefinedChildrenDef: ICommandDefinition = {
        name: "empty_group_def",
        description: "", type: "group"
    };

    const emptyGroupDefinition: ICommandDefinition = {
        name: "empty_group_def",
        description: "", type: "group",
        children: []
    };

    const childrenOfDifferentTypes: ICommandDefinition = {
        name: "with_different_types",
        description: "has children of different types",
        type: "group",
        children: [
            {
                name: "first-command",
                type: "command",
                description: "the first child is a command"
            },
            {
                name: "second-command",
                type: "command",
                description: "the second child is a command"
            },
            {
                name: "first-group",
                type: "group",
                description: "the third child is a group",
                children: [
                    {
                        name: "inner-command",
                        type: "command",
                        description: "inner group child is a command"
                    }
                ]
            },
            {
                name: "second-group",
                type: "group",
                description: "the fourth child is a group",
                children: [
                    {
                        name: "inner-command",
                        type: "command",
                        description: "inner group child is a command"
                    }
                ]
            }
        ]
    };

    describe("error handling", () => {
        it("should detect an invalid command definition type", () => {
            let error;
            try {
                const copy: ICommandDefinition = JSON.parse(JSON.stringify(definition));
                (copy.type as any) = "fake";
                const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                    { commandDefinition: copy, fullCommandTree: fakeParent });
                helpGen.buildHelp();
            } catch (err) {
                error = err;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toMatchSnapshot();
        });
    });

    describe("help text builder", () => {
        it("should construct multiple tables if a group has children of multiple types", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: childrenOfDifferentTypes, fullCommandTree: childrenOfDifferentTypes });
            const tableText = helpGen.buildChildrenSummaryTables();
            expect(tableText).toMatchSnapshot();
        });

        it("should build full help text given a command tree", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildHelp()).toMatchSnapshot();
        });

        it("getGroupHelpText test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            let error: any;
            try {
                helpGen.buildFullGroupHelpText();
            } catch (err) {
                error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toMatch(/Cannot read (property 'sort' of undefined|properties of undefined \(reading 'sort'\))/);
            const rootGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: expParent, fullCommandTree: expParent });
            expect(rootGen.buildFullGroupHelpText()).toMatchSnapshot();
            const cmdChild: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: commandChildren,
                fullCommandTree: expParent
            });
            expect(cmdChild.buildFullGroupHelpText()).toMatchSnapshot();
        });

        it("getCommandHelpText test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildFullCommandHelpText()).toMatchSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildFullCommandHelpText()).toMatchSnapshot();

        });

        it("should getCommandHelpText without hidden option", () => {
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: hiddenOptionDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildFullCommandHelpText()).toMatchSnapshot();

        });

        it("buildCommandAndAliases test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildCommandAndAliases(definition)).toMatchSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildCommandAndAliases(experimentalDefinition)).toMatchSnapshot();
        });

        it("getPrintedActionsOrGroups test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            let error: any;
            try {
                helpGen.buildChildrenSummaryTables();
            } catch (err) {
                error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toMatch(/Cannot read (property 'sort' of undefined|properties of undefined \(reading 'sort'\))/);
            const rootGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: expParent, fullCommandTree: expParent });
            expect(rootGen.buildChildrenSummaryTables()).toMatchSnapshot();
        });

        it("buildUsageDiagram test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildUsageDiagram()).toMatchSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildUsageDiagram()).toMatchSnapshot();
            const expChild: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: commandChildren,
                fullCommandTree: expParent
            });
            expect(expChild.buildUsageDiagram()).toMatchSnapshot();
            const compound: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: compoundParent,
                fullCommandTree: compoundParent
            });
            expect(compound.buildUsageDiagram()).toMatchSnapshot();
            const badDef: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: badDefinitionType,
                fullCommandTree: badDefinitionType
            });
            expect(() => {
                badDef.buildUsageDiagram();
            }).toThrowErrorMatchingSnapshot();
            const undChild: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: undefinedChildrenDef,
                fullCommandTree: undefinedChildrenDef
            });
            expect(undChild.buildUsageDiagram()).toMatchSnapshot();
            const emptyChild: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: emptyGroupDefinition,
                fullCommandTree: emptyGroupDefinition
            });
            expect(emptyChild.buildUsageDiagram()).toMatchSnapshot();
        });

        it("getPrintedUsage test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildUsageSection()).toMatchSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildUsageSection()).toMatchSnapshot();
        });

        it("getPrintedGlobalOptions test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildGlobalOptionsSection()).toMatchSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildGlobalOptionsSection()).toMatchSnapshot();
        });

        it("getPrintedDescription test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildDescriptionSection()).toMatchSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildDescriptionSection()).toMatchSnapshot();
        });

        it("getPrintedPositionalOptions test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(() => {
                helpGen.buildPositionalArgumentsSection();
            }).toThrowErrorMatchingSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildPositionalArgumentsSection()).toMatchSnapshot();
        });

        it("getPrintedNonGlobalOptions test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildCommandOptionsSection()).toMatchSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildCommandOptionsSection()).toMatchSnapshot();
        });

        it("getPrintedOptionOrAction test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildOptionText(definition.options[0].name, definition.options[0].description)).toMatchSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildOptionText(experimentalDefinition.options[0].name,
                experimentalDefinition.options[0].description)).toMatchSnapshot();

            expect(expGen.buildOptionText("", "")).toMatchSnapshot();
        });

        it("getPrintedOptionGroup test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.buildHeader(fakeParent.name)).toMatchSnapshot();
            const expGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(expGen.buildHeader(expParent.name)).toMatchSnapshot();
            expect(() => {
                expGen.buildHeader("");
            }).toThrowErrorMatchingSnapshot();
            expect(() => {
                expGen.buildHeader(null);
            }).toThrowErrorMatchingSnapshot();
        });

        it("getPrintedExamplesText test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.getExperimentalCommandSection()).toMatchSnapshot();
            const experimental: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(experimental.getExperimentalCommandSection()).toMatchSnapshot();
        });

        it("getExperimentalCommandSection test", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: definition, fullCommandTree: fakeParent });
            expect(helpGen.getExperimentalCommandSection()).toMatchSnapshot();
            const experimental: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS, {
                commandDefinition: experimentalDefinition,
                fullCommandTree: expParent
            });
            expect(experimental.getExperimentalCommandSection()).toMatchSnapshot();
        });

        it("should escape Markdown special characters in the description when markdown is rendered",  () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(PARMS_GENERATE_MARKDOWN,
                { commandDefinition: COMMAND_WITH_MARKDOWN_SPECIAL_CHRACTERS, fullCommandTree: fakeParent });
            expect(helpGen.buildDescriptionSection()).toMatchSnapshot();
        });

        it("should remove ANSI escape codes from the help text", async () => {
            const result = (DefaultHelpGenerator.prototype as any).escapeMarkdown(
                `Specifies whether to verify that the objects to be created do not exist\
 on the Db2 subsystem and that the related objects that are required for successful creation\
 of the objects exist on the Db2 subsystem or in the input DDL.
 \n \u001b[90m Default value: no \u001b[0m`
            );

            expect(result).toMatchSnapshot();
        });
    });

    describe("deprecated commands", () => {
        // pretend that we have a team config
        (ImperativeConfig.instance.config as any) = {
            exists: true,
            formMainConfigPathNm: jest.fn(() => {
                return "zowe.config.json";
            })
        };

        it("should show a deprecated message in description", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: deprecatedGroup, fullCommandTree: fakeParent });
            const description = helpGen.buildDescriptionSection();
            expect(description).toContain("This is an example deprecated group with deprecated children");
            expect(description).toContain("Warning: This group has been deprecated");
            expect(description).toContain("Recommended replacement: Use a better group");
        });

        it("should show deprecated indicators in command summary", () => {
            const helpGen: DefaultHelpGenerator = new DefaultHelpGenerator(GENERATOR_PARMS,
                { commandDefinition: deprecatedGroup, fullCommandTree: fakeParent });
            const summary = helpGen.buildChildrenSummaryTables();
            expect(summary).toContain("deprecated-command-one | dc1 Our first deprecated command. (deprecated)");
            expect(summary).toContain("deprecated-command-two | dc2 Our second deprecated command. (deprecated)");
            expect(summary).toContain("not-deprecated-command | ndc Our non-deprecated command.");

            // jest's weird way of testing that a string does not contain a specific string
            expect(summary).toEqual(expect.not.stringContaining("not-deprecated-command | ndc Our non-deprecated command. (deprecated)"));
        });
    });
});
