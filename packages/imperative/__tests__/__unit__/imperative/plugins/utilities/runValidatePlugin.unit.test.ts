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

import { runValidatePlugin } from "../../../../../src/imperative/plugins/utilities/runValidatePlugin";
import { sync } from "cross-spawn";
import { Imperative } from "../../../../../";
import Mock = jest.Mock;

jest.mock("cross-spawn");
jest.mock("../../../../../src/imperative/plugins/utilities/PMFConstants");

const pluginName = "fakePluginName";
const cmdOutputJson = {
    success: true,
    message: "",
    stdout: "The validate commands's standard output",
    stderr: "The validate commands's standard error",
    data: {}
};
const spawnSyncOutput = {
    status: 0,
    stdout: JSON.stringify(cmdOutputJson)
};

describe("runValidatePlugin", () => {
    const mainModule = process.mainModule;

    beforeEach(() => {
        (process.mainModule as any) = {
            filename: __filename
        };
    });

    afterEach(() => {
        process.mainModule = mainModule;
        mocks.spawnSync.mockReset();
    });

    const mocks = {
        spawnSync: sync as any as Mock<typeof sync>
    };

    it("should display both the stdout and stderr of the validate command", () => {
        // mock the output of executing the validatePlugin command
        mocks.spawnSync.mockReturnValue(spawnSyncOutput as any);
        (Imperative as any).mRootCommandName = "dummy";
        const resultMsg = runValidatePlugin(pluginName);
        expect(resultMsg).toContain(cmdOutputJson.stdout);
        expect(resultMsg).toContain(cmdOutputJson.stderr);
    });
});
