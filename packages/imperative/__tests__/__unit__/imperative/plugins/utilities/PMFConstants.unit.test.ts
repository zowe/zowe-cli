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

jest.mock("path");
jest.mock("../../../../logger/src/Logger");
jest.mock("../../../../utilities/ImperativeConfig");

import Mock = jest.Mock;

describe("PMFConstants", () => {
    let {PMFConstants} = require("../../../src/plugins/utilities/PMFConstants");
    let {ImperativeConfig} = require("../../../../utilities/ImperativeConfig");
    let {EnvironmentalVariableSettings} = require("../../../src/env/EnvironmentalVariableSettings");
    let {join} = require("path");

    const cliInstallDir = "installed";
    const mocks = {
        join: join as Mock<typeof join>
    };

    beforeEach(async () => {
        jest.resetModules();
        ({PMFConstants} = await import("../../../src/plugins/utilities/PMFConstants"));
        ({ImperativeConfig} = await import("../../../../utilities/ImperativeConfig"));
        ({EnvironmentalVariableSettings} = await import("../../../src/env/EnvironmentalVariableSettings"));
        ({join} = await import("path"));

        mocks.join = join;
    });

    it("should initialize properly", () => {
        const pmfRoot = `${ImperativeConfig.instance.cliHome}/plugins`;
        const pluginJson = `${pmfRoot}/plugins.json`;

        jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValueOnce({
            pluginsDir: {}
        } as any);
        mocks.join.mockReturnValueOnce(pmfRoot)
            .mockReturnValueOnce(pluginJson)
            .mockReturnValueOnce(cliInstallDir);

        const pmf = PMFConstants.instance;

        expect(pmf.PMF_ROOT).toBe(pmfRoot);
        expect(pmf.PLUGIN_JSON).toBe(pluginJson);
        expect(pmf.PLUGIN_INSTALL_LOCATION).toBe(cliInstallDir);
        expect(pmf.CLI_CORE_PKG_NAME).toBe(ImperativeConfig.instance.hostPackageName);
        expect(pmf.IMPERATIVE_PKG_NAME).toBe(ImperativeConfig.instance.imperativePackageName);
    });

    it("should initialize properly with custom plugins dir", () => {
        const pmfRoot = "/tmp/zowe-plugins";
        const pluginJson = `${pmfRoot}/plugins.json`;

        jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValueOnce({
            pluginsDir: { value: pmfRoot }
        } as any);
        mocks.join.mockReturnValueOnce(pluginJson)
            .mockReturnValueOnce(cliInstallDir);

        const pmf = PMFConstants.instance;

        expect(pmf.PMF_ROOT).toBe(pmfRoot);
        expect(pmf.PLUGIN_JSON).toBe(pluginJson);
        expect(pmf.PLUGIN_INSTALL_LOCATION).toBe(cliInstallDir);
        expect(pmf.CLI_CORE_PKG_NAME).toBe(ImperativeConfig.instance.hostPackageName);
        expect(pmf.IMPERATIVE_PKG_NAME).toBe(ImperativeConfig.instance.imperativePackageName);
    });

    describe("platform specific checks", () => {
        // Be sure to remember the current platform
        const realPlatform = process.platform;

        afterEach(() => {
            Object.defineProperty(process, "platform", {
                value: realPlatform
            });
        });

        it("should point to the correct module location (win32)", () => {
            Object.defineProperty(process, "platform", {
                value: "win32"
            });

            const pmf = PMFConstants.instance;

            expect(pmf.PLUGIN_INSTALL_LOCATION).toEqual(join(pmf.PLUGIN_INSTALL_LOCATION, "node_modules"));
        });

        it("should point to the correct module location (linux)", () => {
            Object.defineProperty(process, "platform", {
                value: "linux"
            });

            const pmf = PMFConstants.instance;

            expect(pmf.PLUGIN_INSTALL_LOCATION).toEqual(join(pmf.PLUGIN_INSTALL_LOCATION, "lib", "node_modules"));
        });
    });
});
