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

import { CommandResponse, ICommandResponse } from "../../../../";
import { ICommandHandler } from "../../../../src/cmd/doc/handler/ICommandHandler";

import { inspect } from "util";
import { MULTIPLE_GROUPS } from "../__resources__/CommandDefinitions";
import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { ICommandHandlerRequire } from "../../../../src/cmd/doc/handler/ICommandHandlerRequire";

jest.mock("../../../../src/imperative/Imperative");

describe("Failed Command Handler", () => {
    it("We should be able to get proper error messages on a non syntax failure", async () => {
        const cmdResp: CommandResponse = new CommandResponse({
            primaryTextColor: "yellow",
            silent: true
        });
        const commandHandler: ICommandHandlerRequire = require("../../../../src/cmd/handlers/FailedCommandHandler");
        const handler: ICommandHandler = new commandHandler.default();
        try {
            await handler.process({
                response: cmdResp,
                arguments: {$0: undefined, _: undefined, failureMessage: "We failed and we're sorry.", error: new Error("What a failure!")},
                definition: MULTIPLE_GROUPS.children?.[0].children?.[0],
                fullDefinition: MULTIPLE_GROUPS,
                profiles: undefined
            } as any);
        } catch (e) {
            TestLogger.info("Error Thrown:\n" + inspect(e));
            TestLogger.info("Command Response:\n" + inspect(cmdResp.buildJsonResponse()));
            const response: ICommandResponse = cmdResp.buildJsonResponse();
            expect(response.success).toEqual(true);
            expect(response.message).toContain("We failed and we're sorry.");
            expect(response.stderr.toString()).toContain("Error: What a failure!");
        }
    });

    it("We should be able to get proper error messages on a syntax failure", async () => {
        const cmdResp: CommandResponse = new CommandResponse({
            primaryTextColor: "yellow",
            silent: true
        });
        const commandHandler: ICommandHandlerRequire = require("../../../../src/cmd/handlers/FailedCommandHandler");
        const handler: ICommandHandler = new commandHandler.default();
        try {
            await handler.process({
                response: cmdResp,
                arguments: {$0: undefined, _: undefined, failureMessage: "We failed syntax and we're sorry.", error: new Error("What a failure!")},
                definition: MULTIPLE_GROUPS.children?.[0].children?.[0],
                fullDefinition: MULTIPLE_GROUPS,
                profiles: undefined
            } as any);
        } catch (e) {
            TestLogger.info("Error Thrown:\n" + inspect(e));
            TestLogger.info("Command Response:\n" + inspect(cmdResp.buildJsonResponse()));
            expect(cmdResp.buildJsonResponse()).toMatchSnapshot();
        }
    });
});
