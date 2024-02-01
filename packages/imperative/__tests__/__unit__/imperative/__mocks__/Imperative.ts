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

import { TextUtils } from "../../../../src/utilities/TextUtils";
import { AbstractHelpGenerator, DefaultHelpGenerator, IHelpGeneratorParms, ICommandDefinition } from "../../../../src/cmd";
import { IImperativeConfig } from "../../../../src/imperative/doc/IImperativeConfig";

const PRIMARY_COLOR: string = "yellow";

export const MOCKED_COMMAND_TREE: ICommandDefinition = {
    name: "test-group",
    description: "a test group",
    type: "group",
    children: [
        {
            name: "test-command-one",
            description: "test command one",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string",
                    required: false
                }
            ]
        },
        {
            name: "test-command-two",
            description: "test command two",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string",
                    required: false
                }
            ]
        }
    ]
};

export class Imperative {

    public static get fullCommandTree(): ICommandDefinition {
        return MOCKED_COMMAND_TREE;
    }

    public static highlightWithPrimaryColor(text: string): string {
        return TextUtils.chalk[PRIMARY_COLOR](text);
    }

    public static get rootCommandName(): string {
        return "mock_command_name";
    }

    public static getHelpGenerator(parms: IHelpGeneratorParms): AbstractHelpGenerator {
        return new DefaultHelpGenerator({
            produceMarkdown: false,
            primaryHighlightColor: PRIMARY_COLOR, rootCommandName: "mock"
        },
        parms);
    }

    private static mLoadedConfig: IImperativeConfig = {
        defaultHome: "/sample-cli/home/",
        progressBarSpinner: ".oO0Oo.",
        name: "sample-cli",
        productDisplayName: "Sample CLI"
    };

}
