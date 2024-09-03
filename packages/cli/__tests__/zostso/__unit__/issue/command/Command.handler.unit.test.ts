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

jest.mock("../../../../../../zostso/lib/IssueTso");
import { IssueTso } from "@zowe/zos-tso-for-zowe-sdk";
import { IHandlerParameters, ImperativeError } from "@zowe/imperative";
import * as Command from "../../../../../src/zostso/issue/command/Command.handler";
import { CommandDefinition } from "../../../../../src/zostso/issue/command/Command.definition";
import { StartTsoData } from "../../../__resources__/StartTsoData";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF_TSO,
    UNIT_TEST_TSO_PROF_OPTS,
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: {
        ...UNIT_TEST_ZOSMF_PROF_OPTS,
        ...UNIT_TEST_TSO_PROF_OPTS,
    },
    positionals: ["zos-tso", "issue", "address-space"],
    definition: CommandDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF_TSO,
});
let PARAMS_NO_SSM_STATEFUL = DEFAULT_PARAMETERS;
PARAMS_NO_SSM_STATEFUL.positionals = [
    "zos-tso",
    "issue",
    "cmd",
    "TIME",
    "--sf",
    "--no-ssm",
];
PARAMS_NO_SSM_STATEFUL.arguments.stateful = false;
PARAMS_NO_SSM_STATEFUL.arguments.suppressStartupMessages = false;
PARAMS_NO_SSM_STATEFUL.arguments.commandText = "TIME";

describe("issue command handler tests", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should issue command", async () => {
        IssueTso.issueTsoCmd = jest.fn((session, acc, cmd, prof) => {
            expect(prof).toBeDefined();
            expect(prof).toMatchSnapshot();
            return StartTsoData.SAMPLE_ISSUE_RESPONSE_WITH_MSG;
        });
        const handler = new Command.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.acc = "acc";
        params.arguments.cmd = "time";
        await handler.process(params);
        expect(IssueTso.issueTsoCmd).toHaveBeenCalledTimes(1);
    });

    it("should be able respond with error message", async () => {
        const failMessage =
            'IZUG1126E: z/OSMF cannot correlate the request for key "ZOSMFAD-SYS2-55-aaakaaac"\n' +
            "with an active z/OS application session.";
        let error;
        IssueTso.issueTsoCmd = jest.fn((session, servletKey) => {
            throw new ImperativeError({ msg: failMessage });
        });
        const handler = new Command.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.servletKey = "ZOSMFAD-SYS2-55-aaakaaac";
        params.arguments.servletKey = "data";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(IssueTso.issueTsoCmd).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should issue command with issueTsoCmd", async () => {
        IssueTso.issueTsoCmd = jest.fn().mockReturnValue({
            success: true,
            startReady: true,
            zosmfResponse: {
                cmdResponse: [
                    {
                        message:
                            "IKJ56650I TIME-00:00:00 AM. CPU-00:00:00 SERVICE-554 SESSION-00:00:00 JANUARY 1,2024",
                    },
                    {
                        message: "READY ",
                    },
                ],
                tsoPromptReceived: "Y",
            },
            commandResponse:
                "IKJ56650I TIME-00:00:00 AM. CPU-00:00:00 SERVICE-554 SESSION-00:00:00 JANUARY 1,2024\nREADY ",
        });
        const handler = new Command.default();
        const params = Object.assign({}, ...[PARAMS_NO_SSM_STATEFUL]);
        await handler.process(params);
        expect(IssueTso.issueTsoCmd).toHaveBeenCalledTimes(1);
    });
});
