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

jest.mock("@zowe/zos-uss-for-zowe-sdk");
import { IHandlerParameters, IProfile, CommandProfiles } from "@zowe/imperative";
import * as SshHandler from "../../../../../src/zosuss/issue/ssh/Ssh.handler";
import * as SshDefinition from "../../../../../src/zosuss/issue/ssh/Ssh.definition";
import { getMockedResponse } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { Shell } from "@zowe/zos-uss-for-zowe-sdk";

process.env.FORCE_COLOR = "0";

const UNIT_TEST_SSH_PROF_OPTS = {
    host: "somewhere.com",
    port: "22",
    user: "someone",
    password: "somesecret"
};

// A mocked profile map with ssh profile
const UNIT_TEST_PROFILE_MAP = new Map<string, IProfile[]>();
UNIT_TEST_PROFILE_MAP.set(
    "ssh", [{
        name: "ssh",
        type: "ssh",
        ...UNIT_TEST_SSH_PROF_OPTS
    }]
);
export const UNIT_TEST_PROFILES_SSH: CommandProfiles = new CommandProfiles(UNIT_TEST_PROFILE_MAP);

// Mocked parameters for the unit tests
const DEFAULT_PARAMETERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zos-uss", "issue", "ssh"],
        ...UNIT_TEST_SSH_PROF_OPTS
    },
    positionals: ["zos-uss", "issue", "ssh"],
    response: getMockedResponse(),
    definition: SshDefinition.SshDefinition,
    fullDefinition: SshDefinition.SshDefinition,
    profiles: UNIT_TEST_PROFILES_SSH
};

const testOutput = "TEST OUTPUT";

describe("issue ssh handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to get stdout", async () => {
        Shell.executeSsh = jest.fn((session, command, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        const handler = new SshHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.command = "pwd";
        await handler.process(params);
        expect(Shell.executeSsh).toHaveBeenCalledTimes(1);
        expect(testOutput).toMatchSnapshot();
    });

    it("should be able to get stdout with cwd option", async () => {
        Shell.executeSshCwd = jest.fn((session, command, cwd, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        const handler = new SshHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.command = "pwd";
        params.arguments.cwd = "/user/home";
        await handler.process(params);
        expect(Shell.executeSshCwd).toHaveBeenCalledTimes(1);
        expect(testOutput).toMatchSnapshot();
    });

});
