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

import { ImperativeConfig, ImperativeError, PluginManagementFacility } from "@zowe/imperative";
import { Services } from "../../../src/apiml/Services";

describe("APIML Services unit tests", () => {
    describe("getPluginApimlConfigs", () => {
        it("should throw an error if Imperative.init has NOT been called", () => {
            let caughtError: Error;
            try {
                Services.getPluginApimlConfigs();
            } catch(error) {
                caughtError = error;
            }
            expect(caughtError).toBeInstanceOf(ImperativeError);
            expect(caughtError.message).toContain("Imperative.init() must be called before getPluginApimlConfigs()");
        });

        it("should form apiml configs for Zowe-CLI and plugins", async () => {
            // get an imperative config from a test file
            const loadedConfigMock = require("./cliImpConfigMock.json");

            // getPluginApimlConfigs calls ImperativeConfig.instance functions
            // that are getters of properties, so mock the getters.
            Object.defineProperty(ImperativeConfig.instance, "loadedConfig", {
                configurable: true,
                get: jest.fn(() => loadedConfigMock)
            });
            Object.defineProperty(ImperativeConfig.instance, "hostPackageName", {
                configurable: true,
                get: jest.fn(() => "@zowe/cli")
            });

            // get all plugin config props from a test file
            const allPluginCfgPropsMock = require("./allPluginCfgPropsMock.json");

            // getPluginApimlConfigs calls PluginManagementFacility.instance functions
            // that are getters of properties, so mock the getters.
            Object.defineProperty(PluginManagementFacility.instance, "allPluginCfgProps", {
                configurable: true,
                get: jest.fn(() => allPluginCfgPropsMock)
            });

            // here's the thing we want to test
            const apimlConfigs = Services.getPluginApimlConfigs();

            // debug: console.log("apimlConfigs:\n" + JSON.stringify(apimlConfigs, null, 2));
            const numOfApimlConfigs = 4;
            const zosmfInx = 0;
            const endvInx1 = 1;
            const endvInx2 = 2;
            const jckInx = 3;

            expect(apimlConfigs.length).toBe(numOfApimlConfigs);

            // we get zosmf from zowe-cli imperative config
            expect(apimlConfigs[zosmfInx].pluginName).toBe("@zowe/cli");

            // we get both entries for endevor
            expect(apimlConfigs[endvInx1].gatewayUrl).toBe("endv_api/v2");
            expect(apimlConfigs[endvInx2].gatewayUrl).toBe("endv_api/v1");

            // we infer the jclcheck profile, which was not specified by that plugin
            expect(apimlConfigs[jckInx].pluginName).toBe("@broadcom/jclcheck-for-zowe-cli");
            expect(apimlConfigs[jckInx].connProfType).toBe("jclcheck");
        });
    });
});
