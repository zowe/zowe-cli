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
        const testCases: IApimlProfileInfo[] = [
            {
                profName: "test0",
                profType: "type0",
                basePaths: [],
                pluginConfigs: [{
                  apiId: "test0-apiId",
                  connProfType: "type0",
                  pluginName: "type0-plugin-name"
                }],
                conflictTypes: []
            },
            {
                profName: "test1",
                profType: "type1",
                basePaths: [
                    "test1/v1",
                    "test1/v2",
                    "test1/v3"
                ],
                pluginConfigs: [],
                conflictTypes: []
            },
            {
                profName: "test2.1",
                profType: "type2",
                basePaths: [
                    "test2.1/v1"
                ],
                pluginConfigs: [],
                conflictTypes: [
                    "serviceId"
                ]
            },
            {
                profName: "test2.2",
                profType: "type2",
                basePaths: [
                    "test2.2/v1"
                ],
                pluginConfigs: [],
                conflictTypes: [
                    "serviceId"
                ]
            },
            {
                profName: "test3",
                profType: "type3",
                basePaths: [
                    "test3/v1",
                    "test3/v1"
                ],
                pluginConfigs: [],
                conflictTypes: [
                    "gatewayUrl"
                ]
            },
            {
                profName: "test5.1",
                profType: "type5",
                basePaths: [
                    "test5/v1",
                    "test5/v2"
                ],
                pluginConfigs: [],
                conflictTypes: [
                    "gatewayUrl",
                    "serviceId"
                ]
            },
            {
                profName: "test5.2",
                profType: "type5",
                basePaths: [
                    "test5/v1",
                    "test5/v2"
                ],
                pluginConfigs: [],
                conflictTypes: [
                    "gatewayUrl",
                    "serviceId"
                ]
            }
        ];

        it("should produce json object with commented conflicts", () => {
          const expectedJson = `{
    "profiles": {
        "test0": {
            "type": "type0",
            "properties": {}
        },
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
        "test2.1": {
            "type": "type2",
            "properties": {
                "basePath": "test2.1/v1"
            }
        },
        "test2.2": {
            "type": "type2",
            "properties": {
                "basePath": "test2.2/v1"
            }
        },
        "test3": {
            "type": "type3",
            "properties": {
                // Multiple base paths were detected for this service.
                // Uncomment one of the lines below to use a different one.
                "basePath": "test3/v1"
                //"basePath": "test3/v1"
            }
        },
        "test5.1": {
            "type": "type5",
            "properties": {
                // Multiple base paths were detected for this service.
                // Uncomment one of the lines below to use a different one.
                "basePath": "test5/v1"
                //"basePath": "test5/v2"
            }
        },
        "test5.2": {
            "type": "type5",
            "properties": {
                // Multiple base paths were detected for this service.
                // Uncomment one of the lines below to use a different one.
                "basePath": "test5/v1"
                //"basePath": "test5/v2"
            }
        }
    },
    "defaults": {
        "type0": "test0",
        "type1": "test1",
        "type2": "test2.1",
        "type3": "test3",
        "type5": "test5.1"
    },
    "plugins": [
        "type0-plugin-name"
    ]
}`;
            expect(JSONC.stringify(Services.convertApimlProfileInfoToProfileConfig(testCases), null, ConfigConstants.INDENT)).toMatchSnapshot();
            expect(JSONC.stringify(Services.convertApimlProfileInfoToProfileConfig(testCases), null, ConfigConstants.INDENT)).toEqual(expectedJson);
        });
    });

});
