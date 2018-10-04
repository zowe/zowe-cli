/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { PingTsoData } from "../../../__resources__/api/PingTsoData";

jest.mock("../../../../src/api/PingTso");
import { IssueTso } from "../../../../../zostso";
import { CommandProfiles, IHandlerParameters, ImperativeError, IProfile } from "@brightside/imperative";
import * as Command from "../../../../src/cli/issue/command/Command.handler";
import { CommandDefinition } from "../../../../src/cli/issue/command/Command.definition";
import { StartTsoData } from "../../../__resources__/api/StartTsoData";


const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set(
    "zosmf", [{
        name: "zosmf",
        type: "zosmf",
        host: "somewhere.com",
        port: "43443",
        user: "someone",
        pass: "somesecret"
    }]
);
PROFILE_MAP.set(
    "tso", [{
        name: "tso",
        type: "tso",
        password: "fake",
        account: "fake"
    }]
);
const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zos-tso", "issue", "address-space"],
    },
    response: {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                expect(setMsgArgs).toMatchSnapshot();
            }),
            setObj: jest.fn((setObjArgs) => {
                expect(setObjArgs).toMatchSnapshot();
            })
        },
        console: {
            log: jest.fn((logs) => {
                expect(logs).toMatchSnapshot();
            }),
            error: jest.fn((errors) => {
                expect(errors).toMatchSnapshot();
            }),
            errorHeader: jest.fn(() => undefined)
        },
        progress: {
            startBar: jest.fn((parms) => undefined),
            endBar: jest.fn(() => undefined)
        },
        format: {
            output: jest.fn((parms) => {
                expect(parms).toMatchSnapshot();
            })
        }
    },
    definition: CommandDefinition,
    fullDefinition: CommandDefinition,
    profiles: PROFILES
};

describe("issue command handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should issue command", async () => {
        IssueTso.issueTsoCommand = jest.fn((session, acc, cmd, prof) => {
            expect(prof).toBeDefined();
            expect(prof).toMatchSnapshot();
            return StartTsoData.SAMPLE_ISSUE_RESPONSE_WITH_MSG;
        });
        const handler = new Command.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        params.arguments.acc = "acc";
        params.arguments.cmd = "time";
        await handler.process(params);
        expect(IssueTso.issueTsoCommand).toHaveBeenCalledTimes(1);
    });

    it("should be able respond with error message", async () => {
        const failMessage = "IZUG1126E: z/OSMF cannot correlate the request for key \"ZOSMFAD-SYS2-55-aaakaaac\"\n" +
            "with an active z/OS application session.";
        let error;
        IssueTso.issueTsoCommand = jest.fn((session, servletKey) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new Command.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        params.arguments.servletKey = "ZOSMFAD-SYS2-55-aaakaaac";
        params.arguments.servletKey = "data";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(IssueTso.issueTsoCommand).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
