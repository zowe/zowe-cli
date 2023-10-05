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

jest.mock("../../../utilities/src/ImperativeConfig");
jest.mock("../../../imperative/src/Imperative");

import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { ICommandDefinition, CommandResponse, CommandPreparer, ICommandHandler } from "../../../cmd";
import { ICommandHandlerRequire } from "../../../cmd/src/doc/handler/ICommandHandlerRequire";
import { ImperativeConfig } from "../../../utilities/src/ImperativeConfig";

/* eslint-disable-next-line jest/no-mocks-import */
import { MOCKED_COMMAND_TREE } from "../../../imperative/src/__mocks__/Imperative";

(CommandResponse as any).spinnerChars = "-oO0)|(0Oo-";
const beforeForceColor = process.env.FORCE_COLOR;
process.env.FORCE_COLOR = "0";

const COMPLEX_COMMAND: ICommandDefinition = {
    name: "test-group",
    description: "my group",
    type: "group",
    children: [
        {
            name: "test-command",
            description: "my command",
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
            name: "test-command-2",
            description: "my command 2",
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

const MULTIPLE_GROUPS: ICommandDefinition = {
    name: "test-outer-group",
    description: "test group",
    type: "group",
    children: [COMPLEX_COMMAND]
};

describe("Default Root Command Handler", () => {

    beforeEach(() => {
        process.env.FORCE_COLOR = "0";
    });

    afterEach(() => {
        (ImperativeConfig as any).mInstance = null;
        process.env.FORCE_COLOR = beforeForceColor;
    });

    it("should display the help if no options are specified", async () => {
        // We also rely on ../../../utilities/src/__mocks__/ImperativeConfig.ts
        const prepared: ICommandDefinition = CommandPreparer.prepare(MULTIPLE_GROUPS);
        const cmdResp: CommandResponse = new CommandResponse({
            primaryTextColor: "yellow",
            silent: true
        });
        const commandHandler: ICommandHandlerRequire = require("../../src/handlers/DefaultRootCommandHandler");
        const handler: ICommandHandler = new commandHandler.default();

        await handler.process({
            response: cmdResp,
            arguments: {_: [], $0: ""},
            definition: prepared.children[0].children[0],
            fullDefinition: prepared,
            profiles: undefined
        });
        TestLogger.info("Help Text: \n" + cmdResp.buildJsonResponse().stdout);
        expect(cmdResp.buildJsonResponse().stdout.toString()).toMatchSnapshot();
    });

    it ("should display a list of available commands with --available-commands", async() => {
        const cmdResp: CommandResponse = new CommandResponse({
            primaryTextColor: "yellow",
            silent: true
        });
        const commandHandler: ICommandHandlerRequire = require("../../src/handlers/DefaultRootCommandHandler");
        const handler: ICommandHandler = new commandHandler.default();
        await handler.process({
            response: cmdResp,
            arguments: {_: [], $0: "", availableCommands: true},
            definition: MULTIPLE_GROUPS,
            fullDefinition: MULTIPLE_GROUPS,
            profiles: undefined
        });

        expect(cmdResp.buildJsonResponse().data).toEqual(MOCKED_COMMAND_TREE);
        expect(cmdResp.buildJsonResponse().stdout.toString()).toMatchSnapshot();
        expect(cmdResp.buildJsonResponse()).toMatchSnapshot();
    });

    it("should display the version if --version is specified", async () => {
        const cmdResp: CommandResponse = new CommandResponse({
            primaryTextColor: "yellow",
            silent: true
        });
        const commandHandler: ICommandHandlerRequire = require("../../src/handlers/DefaultRootCommandHandler");
        const handler: ICommandHandler = new commandHandler.default();

        await handler.process({
            response: cmdResp,
            arguments: {_: [], $0: "", version: true},
            definition: MULTIPLE_GROUPS.children[0].children[0],
            fullDefinition: MULTIPLE_GROUPS,
            profiles: undefined
        });
        TestLogger.info("Version Text: \n" + cmdResp.buildJsonResponse().stdout);
        expect(cmdResp.buildJsonResponse()).toMatchSnapshot();
    });
});
