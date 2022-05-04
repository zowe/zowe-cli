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

jest.mock("../../../../../../zosuss/lib/Shell");

import { IHandlerParameters, IProfile, CommandProfiles } from "@zowe/imperative";
import * as SshHandler from "../../../../../src/zosuss/issue/ssh/Ssh.handler";
import * as SshDefinition from "../../../../../src/zosuss/issue/ssh/Ssh.definition";
import { Shell } from "@zowe/zos-uss-for-zowe-sdk";
import { mockHandlerParameters } from "@zowe/cli-test-utils";
import { join, normalize } from "path";

process.env.FORCE_COLOR = "0";

const UNIT_TEST_SSH_PROF_OPTS = {
    host: "somewhere.com",
    port: "22",
    user: "someone",
    password: "somesecret"
};

const UNIT_TEST_SSH_PROF_OPTS_PRIVATE_KEY = {
    host: "somewhere.com",
    port: "22",
    user: "someone",
    privateKey: normalize(join(__dirname, "..", "..", "..", "..", "..", "..", "zosuss", "__tests__", "__unit__", "__resources__", "fake_id_rsa"))
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
const UNIT_TEST_PROFILES_SSH = new CommandProfiles(UNIT_TEST_PROFILE_MAP);

const UNIT_TEST_PROFILE_MAP_PRIVATE_KEY = new Map<string, IProfile[]>();
UNIT_TEST_PROFILE_MAP_PRIVATE_KEY.set(
    "ssh", [{
        name: "ssh",
        type: "ssh",
        ...UNIT_TEST_SSH_PROF_OPTS_PRIVATE_KEY
    }]
);
const UNIT_TEST_PROFILES_SSH_PRIVATE_KEY = new CommandProfiles(UNIT_TEST_PROFILE_MAP_PRIVATE_KEY);

// Mocked parameters for the unit tests
const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_SSH_PROF_OPTS,
    positionals: ["zos-uss", "issue", "ssh"],
    definition: SshDefinition.SshDefinition,
    profiles: UNIT_TEST_PROFILES_SSH
});

const DEFAULT_PARAMETERS_PRIVATE_KEY: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_SSH_PROF_OPTS_PRIVATE_KEY,
    positionals: ["zos-uss", "issue", "ssh"],
    definition: SshDefinition.SshDefinition,
    profiles: UNIT_TEST_PROFILES_SSH_PRIVATE_KEY
});

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

    it("should be able to get stdout with privateKey", async () => {
        Shell.executeSsh = jest.fn((session, command, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        const handler = new SshHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS_PRIVATE_KEY]);
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
