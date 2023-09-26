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

import { InheritedHelpGenerator } from "./model/InheritedHelpGenerator";
import { IHelpGeneratorFactoryParms } from "../../../cmd/src/help/doc/IHelpGeneratorFactoryParms";
import { ICommandDefinition } from "../../src/doc/ICommandDefinition";
import { ICommandOptionDefinition } from "../../src/doc/option/ICommandOptionDefinition";

const chalkColor: string = "blue";
const oldForceColorOption = process.env.FORCE_COLOR;

describe("Abstract Help Generator Unit Tests", () => {
    const displayName = "dummy";
    beforeAll(async () => {
        process.env.FORCE_COLOR = "0";
    });
    afterAll(() => {
        process.env.FORCE_COLOR = oldForceColorOption;
    }
    );
    const generatorParms: IHelpGeneratorFactoryParms = {
        primaryHighlightColor: chalkColor,
        rootCommandName: "static_command_name",
        produceMarkdown: false
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
    const definitionWithDefault: ICommandDefinition =
        {
            name: "yello",
            type: "command",
            options: [
                {
                    name: "allowThis",
                    description: "this option has default and allowed values",
                    type: "string",
                    defaultValue: "allowed1",
                    allowableValues: {
                        values: [ "allowed1", "allowed2", "allowed3" ]
                    }
                },
                {
                    name: "defaultThis",
                    description: "this option has only default",
                    type: "string",
                    defaultValue: "myDefault",
                },
                {
                    name: "whatever",
                    description: "this option doesn't have any default/allowable",
                    type: "string",
                }
            ],
            description: "my yello command"
        };


    const fakeParent: ICommandDefinition = {
        name: "group_name",
        description: "", type: "group",
        children: [definition]
    };

    it("FormatHelpHeader test", () => {
        expect(() => {
            InheritedHelpGenerator.formatHelpHeader(null, undefined, chalkColor);
        }).toThrowErrorMatchingSnapshot();
        expect(() => {
            InheritedHelpGenerator.formatHelpHeader("", undefined, chalkColor);
        }).toThrowErrorMatchingSnapshot();
        expect(InheritedHelpGenerator.formatHelpHeader("a header", undefined, chalkColor)).toMatchSnapshot();
        expect(InheritedHelpGenerator.formatHelpHeader("another header", "\t", chalkColor)).toMatchSnapshot();
    });


    it("BuildHelp test", () => {
        const abstractHelpGenerator = new InheritedHelpGenerator(generatorParms, { commandDefinition: definition, fullCommandTree: fakeParent });
        expect(abstractHelpGenerator.buildHelp()).toMatchSnapshot();
    });

    it("getOptionAndAliasesString test", () => {
        const abstractHelpGenerator = new InheritedHelpGenerator(generatorParms, { commandDefinition: definition, fullCommandTree: fakeParent });

        // standard cases
        const goodOptionMultipleAliases: ICommandOptionDefinition = {
            name: "my_option",
            aliases: ["my_opt", "m_o", "m"],
            description: "option_description",
            type: "string",
        };
        const goodOptionSingleAlias: ICommandOptionDefinition = {
            name: "my_option",
            aliases: ["my_opt"],
            description: "option_description",
            type: "string",
        };
        const goodOptionNoAlias: ICommandOptionDefinition = {
            name: "my_option",
            description: "option_description",
            type: "string",
        };
        const goodOptionSingleChar: ICommandOptionDefinition = {
            name: "o",
            description: "option_description",
            type: "string",
        };
        expect(abstractHelpGenerator.getOptionAndAliasesString(goodOptionMultipleAliases)).toMatchSnapshot("Good Option, multiple alias");
        goodOptionMultipleAliases.required = true;
        expect(abstractHelpGenerator.getOptionAndAliasesString(goodOptionMultipleAliases)).toMatchSnapshot("Good option, multiple alias, required");
        expect(abstractHelpGenerator.getOptionAndAliasesString(goodOptionSingleAlias)).toMatchSnapshot("Good option, single alias");
        expect(abstractHelpGenerator.getOptionAndAliasesString(goodOptionNoAlias)).toMatchSnapshot("Good option, no alias present");
        expect(abstractHelpGenerator.getOptionAndAliasesString(goodOptionSingleChar)).toMatchSnapshot("Good option, single char");

        const badOptionAliasEdgeCases: ICommandOptionDefinition = {
            name: "my_option",
            aliases: [""],
            description: "option_description",
            type: "string",
        };
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionAliasEdgeCases)).toMatchSnapshot("Empty alias \"\"");
        badOptionAliasEdgeCases.aliases = ["", "", ""];
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionAliasEdgeCases)).toMatchSnapshot("Alias array empty strings [ \"\",\"\"]");
        badOptionAliasEdgeCases.aliases = [null];
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionAliasEdgeCases)).toMatchSnapshot("Alias array is a null element");
        badOptionAliasEdgeCases.aliases = ["ma", null, "m"];
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionAliasEdgeCases))
            .toMatchSnapshot("Alias array with a null inbetween good elements");
        badOptionAliasEdgeCases.aliases = ["", "ba", "m"];
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionAliasEdgeCases))
            .toMatchSnapshot("Alias array with a blank as well as good elements");

        const badOptionNameEdgeCases: ICommandOptionDefinition = {
            name: "",
            description: "option_description",
            type: "string",
        };
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionNameEdgeCases)).toMatchSnapshot("Empty name");
        badOptionNameEdgeCases.name = null;
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionNameEdgeCases)).toMatchSnapshot("Null name");

        const badOptionTypeEdgeCases: ICommandOptionDefinition = {
            name: "good_name",
            description: "option_description",
            type: "",
        } as any;
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionTypeEdgeCases)).toMatchSnapshot("Empty type");
        badOptionTypeEdgeCases.type = null;
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionTypeEdgeCases)).toMatchSnapshot("Null type");
        badOptionTypeEdgeCases.type = "notexist" as any;
        expect(abstractHelpGenerator.getOptionAndAliasesString(badOptionTypeEdgeCases)).toMatchSnapshot("Non-existent type");
    });

    it("buildOptionMaps test", () => {
        const cloneDef = JSON.parse(JSON.stringify(definition));
        const abstractHelpGenerator = new InheritedHelpGenerator(generatorParms, { commandDefinition: cloneDef, fullCommandTree: fakeParent });
        abstractHelpGenerator.buildOptionsMapsTest();
        expect(abstractHelpGenerator).toMatchSnapshot();
        cloneDef.options = null;
        abstractHelpGenerator.buildOptionsMapsTest();
        expect(abstractHelpGenerator).toMatchSnapshot();
    });

    it("buildOptionMaps with default/allowable test", () => {
        const abstractHelpGenerator = new InheritedHelpGenerator(generatorParms,
            { commandDefinition: definitionWithDefault, fullCommandTree: fakeParent });
        abstractHelpGenerator.buildOptionsMapsTest();
        expect(abstractHelpGenerator.optionToDescription).toMatchSnapshot();
    });

    it("getCaseSensitiveFlagByOptionName test", () => {
        const abstractHelpGenerator = new InheritedHelpGenerator(generatorParms, { commandDefinition: definition, fullCommandTree: fakeParent });
        expect(abstractHelpGenerator.getCaseSensitiveFlagByOptionNameTest("aReaLOption")).toMatchSnapshot();
        expect(abstractHelpGenerator.getCaseSensitiveFlagByOptionNameTest("fakeOption")).toMatchSnapshot();
        expect(abstractHelpGenerator.getCaseSensitiveFlagByOptionNameTest("")).toMatchSnapshot();
        expect(abstractHelpGenerator.getCaseSensitiveFlagByOptionNameTest(undefined)).toMatchSnapshot();
    });

    it("renderHelp test", () => {
        const abstractHelpGenerator = new InheritedHelpGenerator(generatorParms, { commandDefinition: definition, fullCommandTree: fakeParent });
        expect(abstractHelpGenerator.renderHelpTest("basic help")).toMatchSnapshot();
        expect(abstractHelpGenerator.renderHelpTest("{{indent}} indented help")).toMatchSnapshot();
        expect(abstractHelpGenerator.renderHelpTest("{{space}} {{space}} space help")).toMatchSnapshot();
        expect(abstractHelpGenerator.renderHelpTest("{{italic}} italics")).toMatchSnapshot();
        expect(abstractHelpGenerator.renderHelpTest("{{header}} HEADER TEXT")).toMatchSnapshot();
        expect(abstractHelpGenerator.renderHelpTest("{{bullet}} bullet one \n {{bullet}} bullet two")).toMatchSnapshot();
        expect(abstractHelpGenerator.renderHelpTest("{{codeBegin}} code start {{codeEnd}}")).toMatchSnapshot();
        expect(abstractHelpGenerator.renderHelpTest("{{codeEnd}} code reverse {{codeStart}}")).toMatchSnapshot();
        expect(abstractHelpGenerator.renderHelpTest("{{codeEnd} code bad {codeStart}}")).toMatchSnapshot();
        expect(abstractHelpGenerator.renderHelpTest("")).toMatchSnapshot();
        expect(() => {
            abstractHelpGenerator.renderHelpTest(undefined);
        }).toThrowErrorMatchingSnapshot();
    });

    it("explainType test", () => {
        const abstractHelpGenerator = new InheritedHelpGenerator(generatorParms, { commandDefinition: definition, fullCommandTree: fakeParent });
        for (const type of ["string", "number", "json", "existingLocalFile", "array", "boolean", "count"]) {
            expect((abstractHelpGenerator as any).explainType(type as any)).toMatchSnapshot();
        }
    });
});
