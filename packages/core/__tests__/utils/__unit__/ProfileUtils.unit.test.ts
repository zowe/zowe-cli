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

import * as ProfileUtils from "../../../src/utils/ProfileUtils";
import { ImperativeConfig, EnvironmentalVariableSettings } from "@zowe/imperative";
import * as os from "os";
import * as path from "path";

describe("ProfileUtils", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getZoweDir", () => {
        const expectedLoadedConfig = {
            name: "zowe",
            defaultHome: path.join("z", "zowe"),
            envVariablePrefix: "ZOWE"
        };
        let defaultHome: string;

        beforeEach(() => {
            jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValue({ cliHome: { value: null } } as any);
            ImperativeConfig.instance.loadedConfig = undefined;
            jest.spyOn(os, "homedir").mockReturnValue(expectedLoadedConfig.defaultHome);
            defaultHome = path.join(expectedLoadedConfig.defaultHome, ".zowe");
        });

        it("should return the ENV cliHome even if loadedConfig is set in the process", () => {
            jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValue({ cliHome: { value: "test" } } as any);
            expect(ImperativeConfig.instance.loadedConfig).toBeUndefined();
            expect(ProfileUtils.getZoweDir()).toEqual("test");
            expect(ImperativeConfig.instance.loadedConfig).toEqual({ ...expectedLoadedConfig, defaultHome });
        });

        it("should return the defaultHome and set loadedConfig if undefined", () => {
            expect(ImperativeConfig.instance.loadedConfig).toBeUndefined();
            expect(ProfileUtils.getZoweDir()).toEqual(defaultHome);
            expect(ImperativeConfig.instance.loadedConfig).toEqual({ ...expectedLoadedConfig, defaultHome });
        });

        it("should return the defaultHome and reset loadedConfig if defaultHome changes", () => {
            expect(ImperativeConfig.instance.loadedConfig).toBeUndefined();
            ImperativeConfig.instance.loadedConfig = { ...expectedLoadedConfig, defaultHome: "test" };
            expect(ImperativeConfig.instance.loadedConfig?.defaultHome).toEqual("test");
            expect(ProfileUtils.getZoweDir()).toEqual(defaultHome);
            expect(ImperativeConfig.instance.loadedConfig).toEqual({ ...expectedLoadedConfig, defaultHome });
        });

        it("should return the defaultHome without resetting loadedConfig", () => {
            expect(ImperativeConfig.instance.loadedConfig).toBeUndefined();
            ImperativeConfig.instance.loadedConfig = expectedLoadedConfig;
            expect(ProfileUtils.getZoweDir()).toEqual(defaultHome);
            expect(ImperativeConfig.instance.loadedConfig).toEqual({ ...expectedLoadedConfig, defaultHome });
        });
    });
});
