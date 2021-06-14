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

import { Services } from "../../../src/apiml/Services";
import { ZosmfRestClient } from "../../../src/rest/ZosmfRestClient";
import { ConfigConstants, ImperativeConfig, ImperativeError, PluginManagementFacility,
         RestConstants, Session
} from "@zowe/imperative";
import { IApimlProfileInfo } from "../../../src/apiml/doc/IApimlProfileInfo";
import * as JSONC from "comment-json";

describe("APIML Services unit tests", () => {

    describe("Constants", () => {
        it("should be tested", () => {
            expect(true).toBe(false);
        });
    });

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

    describe("getServicesByConfig", () => {
        const basicSession: Partial<Session> = {
            ISession: {
                type: "basic",
                user: "fakeUser",
                password: "fakePassword"
            }
        };
        const tokenSession: Partial<Session> = {
            ISession: {
                type: "token",
                tokenType: "apimlAuthenticationToken",
                tokenValue: "fakeToken"
            }
        };

        it("should require username for basic sessions", async () => {
            let caughtError;

            try {
                await Services.getServicesByConfig({
                    ISession: {
                        type: "basic",
                        password: "fakePassword"
                    }
                } as any, []);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toBe("Token value for API ML token login must be defined.");
        });
    });

    describe("convertApimlProfileInfoToProfileConfig", () => {
        const temp: any[] = [ //TODO: fix compile errors: IApimlProfileInfo [] = [
            {
                profName: "test1",
                profType: "type1",
                basePaths: [
                    "test1/v1",
                    "test1/v2",
                    "test1/v3"
                ]
            },
            {
                profName: "test2",
                profType: "type2",
                basePaths: []
            },
            {
                profName: "test3",
                profType: "type3",
                basePaths: [
                    "test3/v1"
                ]
            },
            {
                profName: "test4",
                profType: "type4",
                basePaths: [
                    "test4/v1",
                    "test4/v1"
                ]
            }
        ];

        it("should produce json object with commented conflicts", () => {
            const expectedJson = `{
    "properties": {},
    "profiles": {
        "test1": {
            "type": "type1",
            "properties": {
                // Multiple base paths were detected for this service.
                // Uncomment one of the lines below to use a different one.
                "basePath": "test1/v1"
                //"basePath": "test1/v2"
                //"basePath": "test1/v3"
            }
        },
        "test2": {
            "type": "type2",
            "properties": {}
        },
        "test3": {
            "type": "type3",
            "properties": {
                "basePath": "test3/v1"
            }
        },
        "test4": {
            "type": "type4",
            "properties": {
                // Multiple base paths were detected for this service.
                // Uncomment one of the lines below to use a different one.
                "basePath": "test4/v1"
                //"basePath": "test4/v1"
            }
        }
    }
}`;
            expect(JSONC.stringify(Services.convertApimlProfileInfoToProfileConfig(temp), null, ConfigConstants.INDENT)).toMatchSnapshot();
            expect(JSONC.stringify(Services.convertApimlProfileInfoToProfileConfig(temp), null, ConfigConstants.INDENT)).toEqual(expectedJson);
        });
    });

});
