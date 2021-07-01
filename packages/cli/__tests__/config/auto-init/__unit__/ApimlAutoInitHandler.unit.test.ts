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

import ApimlAutoInitHandler from "../../../../src/config/auto-init/ApimlAutoInitHandler";
import { SessConstants, ImperativeConfig, IHandlerParameters } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { Services } from "@zowe/core-for-zowe-sdk";

describe("ApimlAutoInitHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should not have changed - no special arguments", async () => {
        const mockCreateZosmfSession = jest.fn();
        const mockGetPluginApimlConfigs = jest.fn().mockReturnValue([]);
        const mockGetServicesByConfig = jest.fn().mockResolvedValue([]);
        const mockConvertApimlProfileInfoToProfileConfig = jest.fn().mockReturnValue({
            defaults: {},
            profiles: {},
            plugins: []
        });
        const mockActivate = jest.fn();
        const mockMerge = jest.fn();
        const mockWrite = jest.fn();
        const mockImperativeConfigApi = {
            layers: {
                activate: mockActivate,
                merge: mockMerge,
                write: mockWrite
            }
        }

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Services.getPluginApimlConfigs = mockGetPluginApimlConfigs;
        Services.getServicesByConfig = mockGetServicesByConfig;
        Services.convertApimlProfileInfoToProfileConfig = mockConvertApimlProfileInfoToProfileConfig;
        jest.spyOn(ImperativeConfig, 'instance', "get").mockReturnValue({
            config: {
                api: mockImperativeConfigApi
            }
        });

        const handler: any = new ApimlAutoInitHandler();
        expect(handler.mProfileType).toBe("base");

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        await handler.doAutoInit(undefined, {
            arguments: {
                $0: "fake",
                _: ["fake"]
            }
        });
        expect(mockGetPluginApimlConfigs).toHaveBeenCalledTimes(1);
        expect(mockGetServicesByConfig).toHaveBeenCalledTimes(1);
        expect(mockConvertApimlProfileInfoToProfileConfig).toHaveBeenCalledTimes(1);
        expect(mockActivate).toHaveBeenCalledTimes(1);
        expect(mockMerge).toHaveBeenCalledTimes(1);
        expect(mockWrite).toHaveBeenCalledTimes(1);
    });

    it("should not have changed - edit", async () => {
        const mockCreateZosmfSession = jest.fn();
        const mockGetPluginApimlConfigs = jest.fn().mockReturnValue([]);
        const mockGetServicesByConfig = jest.fn().mockResolvedValue([]);
        const mockConvertApimlProfileInfoToProfileConfig = jest.fn().mockReturnValue({
            defaults: {},
            profiles: {},
            plugins: []
        });
        const mockActivate = jest.fn();
        const mockMerge = jest.fn();
        const mockWrite = jest.fn();
        const mockGet = jest.fn().mockReturnValue({path: "fake"});
        const mockOpen = jest.fn().mockResolvedValue(undefined);
        const mockImperativeConfigApi = {
            layers: {
                activate: mockActivate,
                merge: mockMerge,
                write: mockWrite,
                get: mockGet
            }
        }

        jest.mock('open', () => {
            return {
                default: mockOpen
            }
        });

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Services.getPluginApimlConfigs = mockGetPluginApimlConfigs;
        Services.getServicesByConfig = mockGetServicesByConfig;
        Services.convertApimlProfileInfoToProfileConfig = mockConvertApimlProfileInfoToProfileConfig;
        jest.spyOn(ImperativeConfig, 'instance', "get").mockReturnValue({
            config: {
                api: mockImperativeConfigApi
            }
        });

        const handler: any = new ApimlAutoInitHandler();
        expect(handler.mProfileType).toBe("base");

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        await handler.doAutoInit(undefined, {
            arguments: {
                $0: "fake",
                _: ["fake"],
                edit: true
            }
        });
        expect(mockGetPluginApimlConfigs).toHaveBeenCalledTimes(1);
        expect(mockGetServicesByConfig).toHaveBeenCalledTimes(1);
        expect(mockConvertApimlProfileInfoToProfileConfig).toHaveBeenCalledTimes(1);
        expect(mockActivate).toHaveBeenCalledTimes(1);
        expect(mockMerge).toHaveBeenCalledTimes(0);
        expect(mockWrite).toHaveBeenCalledTimes(0);
        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockOpen).toHaveBeenCalledTimes(1);
    });
});
