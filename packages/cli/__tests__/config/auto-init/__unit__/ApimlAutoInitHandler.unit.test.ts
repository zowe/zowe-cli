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
import { SessConstants, ImperativeConfig, IHandlerParameters, RestClientError, IRestClientError } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { Login, Services } from "@zowe/core-for-zowe-sdk";

describe("ApimlAutoInitHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should not have changed - user & password", async () => {
        const mockCreateZosmfSession = jest.fn();
        const mockGetPluginApimlConfigs = jest.fn().mockReturnValue([]);
        const mockGetServicesByConfig = jest.fn().mockResolvedValue([]);
        const mockConvertApimlProfileInfoToProfileConfig = jest.fn().mockReturnValue({
            defaults: {},
            profiles: {},
            plugins: []
        });
        const mockLogin = jest.fn().mockResolvedValue("fakeToken");

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Services.getPluginApimlConfigs = mockGetPluginApimlConfigs;
        Services.getServicesByConfig = mockGetServicesByConfig;
        Services.convertApimlProfileInfoToProfileConfig = mockConvertApimlProfileInfoToProfileConfig;
        Login.apimlLogin = mockLogin;

        const handler: any = new ApimlAutoInitHandler();
        expect(handler.mProfileType).toBe("base");

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        const response = await handler.doAutoInit(
        {
            ISession: {
                hostname: "fake",
                port: 1234,
                user: "fake",
                password: "fake",
                type: SessConstants.AUTH_TYPE_BASIC,
                tokenType: undefined
            }
        }, {
            arguments: {
                $0: "fake",
                _: ["fake"]
            }
        });
        expect(mockGetPluginApimlConfigs).toHaveBeenCalledTimes(1);
        expect(mockGetServicesByConfig).toHaveBeenCalledTimes(1);
        expect(mockConvertApimlProfileInfoToProfileConfig).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(response.profiles.base.secure).toContain("tokenValue");
        expect(response.profiles.base.properties.tokenType).toEqual(SessConstants.TOKEN_TYPE_APIML);
        expect(response.profiles.base.properties.tokenValue).toEqual("fakeToken");
    });

    it("should not have changed - tokenType and tokenValue", async () => {
        const mockCreateZosmfSession = jest.fn();
        const mockGetPluginApimlConfigs = jest.fn().mockReturnValue([]);
        const mockGetServicesByConfig = jest.fn().mockResolvedValue([]);
        const mockConvertApimlProfileInfoToProfileConfig = jest.fn().mockReturnValue({
            defaults: {},
            profiles: {},
            plugins: []
        });
        const mockLogin = jest.fn().mockResolvedValue("fakeToken");

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Services.getPluginApimlConfigs = mockGetPluginApimlConfigs;
        Services.getServicesByConfig = mockGetServicesByConfig;
        Services.convertApimlProfileInfoToProfileConfig = mockConvertApimlProfileInfoToProfileConfig;
        Login.apimlLogin = mockLogin;

        const handler: any = new ApimlAutoInitHandler();
        expect(handler.mProfileType).toBe("base");

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        const response = await handler.doAutoInit(
        {
            ISession: {
                hostname: "fake",
                port: 1234,
                type: SessConstants.AUTH_TYPE_BASIC,
                tokenType: SessConstants.TOKEN_TYPE_APIML,
                tokenValue: "fakeToken"
            }
        }, {
            arguments: {
                $0: "fake",
                _: ["fake"]
            }
        });
        expect(mockGetPluginApimlConfigs).toHaveBeenCalledTimes(1);
        expect(mockGetServicesByConfig).toHaveBeenCalledTimes(1);
        expect(mockConvertApimlProfileInfoToProfileConfig).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledTimes(0);
        expect(response.profiles.base.secure).toContain("tokenValue");
        expect(response.profiles.base.properties.tokenType).toEqual(SessConstants.TOKEN_TYPE_APIML);
        expect(response.profiles.base.properties.tokenValue).toEqual("fakeToken");
    });

    it("should not have changed - user & password with existing base profile", async () => {
        const mockCreateZosmfSession = jest.fn();
        const mockGetPluginApimlConfigs = jest.fn().mockReturnValue([]);
        const mockGetServicesByConfig = jest.fn().mockResolvedValue([]);
        const mockConvertApimlProfileInfoToProfileConfig = jest.fn().mockReturnValue({
            defaults: { base: "base"},
            profiles: {
                "base": {
                    properties: {
                        host: "fake",
                        port: 12345
                    },
                    secure: [],
                    profiles: {}
                }
            },
            plugins: []
        });
        const mockLogin = jest.fn().mockResolvedValue("fakeToken");

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Services.getPluginApimlConfigs = mockGetPluginApimlConfigs;
        Services.getServicesByConfig = mockGetServicesByConfig;
        Services.convertApimlProfileInfoToProfileConfig = mockConvertApimlProfileInfoToProfileConfig;
        Login.apimlLogin = mockLogin;

        const handler: any = new ApimlAutoInitHandler();
        expect(handler.mProfileType).toBe("base");

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        const response = await handler.doAutoInit(
        {
            ISession: {
                hostname: "fake",
                port: 1234,
                user: "fake",
                password: "fake",
                type: SessConstants.AUTH_TYPE_BASIC,
                tokenType: undefined
            }
        }, {
            arguments: {
                $0: "fake",
                _: ["fake"]
            }
        });
        expect(mockGetPluginApimlConfigs).toHaveBeenCalledTimes(1);
        expect(mockGetServicesByConfig).toHaveBeenCalledTimes(1);
        expect(mockConvertApimlProfileInfoToProfileConfig).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledTimes(0);
        expect(response.profiles.base.secure).not.toContain("tokenValue");
        expect(response.profiles.base.properties.tokenType).not.toBeDefined();
        expect(response.profiles.base.properties.tokenValue).not.toBeDefined();
    });

    it("should not have changed - a condition that shouldn't ever happen", async () => {
        const mockCreateZosmfSession = jest.fn();
        const mockGetPluginApimlConfigs = jest.fn().mockReturnValue([]);
        const mockGetServicesByConfig = jest.fn().mockResolvedValue([]);
        const mockConvertApimlProfileInfoToProfileConfig = jest.fn().mockReturnValue({
            defaults: {},
            profiles: {},
            plugins: []
        });
        const mockLogin = jest.fn().mockResolvedValue("fakeToken");

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Services.getPluginApimlConfigs = mockGetPluginApimlConfigs;
        Services.getServicesByConfig = mockGetServicesByConfig;
        Services.convertApimlProfileInfoToProfileConfig = mockConvertApimlProfileInfoToProfileConfig;
        Login.apimlLogin = mockLogin;

        const handler: any = new ApimlAutoInitHandler();
        expect(handler.mProfileType).toBe("base");

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        const response = await handler.doAutoInit(
        {
            ISession: {
                hostname: "fake",
                port: 1234,
                type: SessConstants.AUTH_TYPE_BASIC
            }
        }, {
            arguments: {
                $0: "fake",
                _: ["fake"]
            }
        });
        expect(mockGetPluginApimlConfigs).toHaveBeenCalledTimes(1);
        expect(mockGetServicesByConfig).toHaveBeenCalledTimes(1);
        expect(mockConvertApimlProfileInfoToProfileConfig).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledTimes(0);
        expect(response.profiles.base.secure).not.toContain("tokenValue");
        expect(response.profiles.base.properties.tokenType).not.toBeDefined();
        expect(response.profiles.base.properties.tokenValue).not.toBeDefined();
    });

    it("should throw an error if an error 403 is experienced", async () => {
        const statusCode = 403;
        const mockCreateZosmfSession = jest.fn();
        const mockGetPluginApimlConfigs = jest.fn().mockReturnValue([])
        const mockGetServicesByConfig = jest.fn().mockImplementation(() => {
            const errData: IRestClientError = {
                httpStatus: statusCode,
                additionalDetails: "Fake Additional Details",
                msg: "Fake message",
                source: "http"
            }
            throw new RestClientError(errData);
        });;
        const mockConvertApimlProfileInfoToProfileConfig = jest.fn().mockReturnValue({
            defaults: {},
            profiles: {},
            plugins: []
        });
        const mockLogin = jest.fn().mockResolvedValue("fakeToken");

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Services.getPluginApimlConfigs = mockGetPluginApimlConfigs;
        Services.getServicesByConfig = mockGetServicesByConfig;
        Services.convertApimlProfileInfoToProfileConfig = mockConvertApimlProfileInfoToProfileConfig;
        Login.apimlLogin = mockLogin;

        const handler: any = new ApimlAutoInitHandler();
        expect(handler.mProfileType).toBe("base");

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        let error;

        try {
            await handler.doAutoInit(
            {
                ISession: {
                    hostname: "fake",
                    port: 1234,
                    user: "fake",
                    password: "fake",
                    type: SessConstants.AUTH_TYPE_BASIC,
                    tokenType: undefined
                }
            }, {
                arguments: {
                    $0: "fake",
                    _: ["fake"]
                }
            });
        } catch (err) {
            error = err;
        }
        expect(mockGetPluginApimlConfigs).toHaveBeenCalledTimes(1);
        expect(mockGetServicesByConfig).toHaveBeenCalledTimes(1);
        expect(mockConvertApimlProfileInfoToProfileConfig).toHaveBeenCalledTimes(0);
        expect(mockLogin).toHaveBeenCalledTimes(0);
        expect(error).toBeDefined();
        expect(error.message).toContain("HTTP(S) error status 403 received. Verify the user has access to the APIML API Services SAF resource.");
    });
});
