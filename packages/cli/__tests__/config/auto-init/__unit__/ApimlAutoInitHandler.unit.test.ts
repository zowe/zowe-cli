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
import { SessConstants, RestClientError, IRestClientError, ImperativeConfig, IConfig, ConfigUtils, Config } from "@zowe/core-for-zowe-sdk";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { IApimlProfileInfo, IProfileRpt, Login, Services } from "@zowe/core-for-zowe-sdk";
import * as lodash from "lodash";
import stripAnsi = require("strip-ansi");

function mockConfigApi(properties: IConfig | undefined): any {
    properties = properties || Config.empty();
    return {
        api: {
            layers: {
                get: () => ({
                    exists: true,
                    path: "fakePath",
                    properties
                })
            },
            profiles: {
                getProfilePathFromName: (name: string) => `profiles.${name}`,
                get: jest.fn()
            }
        },
        exists: true,
        properties
    };
}

describe("ApimlAutoInitHandler", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
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
        jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(undefined));

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
                    tokenType: undefined,
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
        jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(undefined));

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

    it("should not have changed - PEM Certificates", async () => {
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
        jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(undefined));

        const handler: any = new ApimlAutoInitHandler();
        expect(handler.mProfileType).toBe("base");

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        const response = await handler.doAutoInit(
            {
                ISession: {
                    hostname: "fake",
                    port: 1234,
                    cert: "/fake/cert/file.pem",
                    certKey: "/fake/cert/key.pem",
                    type: SessConstants.AUTH_TYPE_CERT_PEM,
                    tokenType: undefined,
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

    it("should not have changed - user & password with existing base profile", async () => {
        // NOTE: Token type and token value will be stored, but user and password will still be present in the base profile
        const mockCreateZosmfSession = jest.fn();
        const mockGetPluginApimlConfigs = jest.fn().mockReturnValue([]);
        const mockGetServicesByConfig = jest.fn().mockResolvedValue([]);
        jest.spyOn(ConfigUtils, "getActiveProfileName").mockReturnValueOnce("base");
        const mockConfigValue: any = {
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
        };
        const mockConvertApimlProfileInfoToProfileConfig = jest.fn().mockReturnValue(mockConfigValue);
        const mockLogin = jest.fn().mockResolvedValue("fakeToken");
        jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(mockConfigValue));

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
        expect(response.profiles.base.properties.tokenType).toBeDefined();
        expect(response.profiles.base.properties.tokenValue).toBeDefined();
    });

    it("should not have changed - rejectUnauthorized flag true", async () => {
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
        jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(undefined));

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
                    tokenType: undefined,
                    rejectUnauthorized: true
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
        expect(response.profiles.base.properties.rejectUnauthorized).toEqual(true);
    });

    it("should not have changed - rejectUnauthorized flag false", async () => {
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
        jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(undefined));

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
                    tokenType: undefined,
                    rejectUnauthorized: false
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
        expect(response.profiles.base.properties.rejectUnauthorized).toEqual(false);
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
        jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(undefined));

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
        const mockGetPluginApimlConfigs = jest.fn().mockReturnValue([]);
        const mockGetServicesByConfig = jest.fn().mockImplementation(() => {
            const errData: IRestClientError = {
                httpStatus: statusCode,
                additionalDetails: "Fake Additional Details",
                msg: "Fake message",
                source: "http"
            };
            throw new RestClientError(errData);
        });
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
        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error.message).toContain("HTTP(S) error status 403 received. Verify the user has access to the APIML API Services SAF resource.");
    });

    describe("reporting", () => {
        const apimlProfInfos: IApimlProfileInfo[] = [
            {
                profName: "abcxyz",
                profType: "fake",
                basePaths: ["api/v1", "api/v2"],
                pluginConfigs: new Set([
                    {
                        apiId: "org.abc.xyz",
                        connProfType: "fake",
                        pluginName: "@abc/xyz-plugin-for-zowe-cli"
                    }
                ]),
                gatewayUrlConflicts: {}
            },
            {
                profName: "defxyz",
                profType: "fake",
                basePaths: ["api/v1"],
                pluginConfigs: new Set([
                    {
                        apiId: "org.def.xyz",
                        connProfType: "fake",
                        pluginName: "@def/xyz-plugin-for-zowe-cli"
                    }
                ]),
                gatewayUrlConflicts: {}
            },
        ];

        const profileReports: IProfileRpt[] = [
            {
                altProfiles: [
                    {
                        altBasePath: apimlProfInfos[0].basePaths[1],
                        altProfName: apimlProfInfos[0].profName,
                        altProfType: apimlProfInfos[0].profType
                    },
                    {
                        altBasePath: apimlProfInfos[1].basePaths[0],
                        altProfName: apimlProfInfos[1].profName,
                        altProfType: apimlProfInfos[1].profType
                    }
                ],
                baseOverrides: [],
                basePath: apimlProfInfos[0].basePaths[0],
                changeForProf: "No changes to",
                pluginNms: [
                    [...apimlProfInfos[0].pluginConfigs][0].pluginName
                ],
                profName: apimlProfInfos[0].profName,
                profType: apimlProfInfos[0].profType
            },
            {
                altProfiles: [
                    {
                        altBasePath: apimlProfInfos[0].basePaths[0],
                        altProfName: apimlProfInfos[0].profName,
                        altProfType: apimlProfInfos[0].profType
                    },
                    {
                        altBasePath: apimlProfInfos[0].basePaths[1],
                        altProfName: apimlProfInfos[0].profName,
                        altProfType: apimlProfInfos[0].profType
                    }
                ],
                baseOverrides: [],
                basePath: apimlProfInfos[1].basePaths[0],
                changeForProf: "No changes to",
                pluginNms: [
                    [...apimlProfInfos[1].pluginConfigs][0].pluginName
                ],
                profName: apimlProfInfos[1].profName,
                profType: apimlProfInfos[1].profType
            }
        ];

        it("should record all profiles with associated API ML services", () => {
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(undefined));
            const handler = new ApimlAutoInitHandler();
            (handler as any).recordProfilesFound(apimlProfInfos);
            expect((handler as any).mAutoInitReport.profileRpts).toEqual(profileReports);
        });

        it("should detect when all profiles are new and starting config is null", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                profileRpts: profileReports,
                startingConfig: null
            };
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(undefined));
            (handler as any).recordProfileUpdates();
            expect((handler as any).mAutoInitReport.changeForConfig).toBe("Created");
            for (const profileReport of (handler as any).mAutoInitReport.profileRpts) {
                expect(profileReport.changeForProf).toBe("Created");
            }
        });

        it("should detect when all profiles are new and starting config does not exist", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                profileRpts: profileReports,
                startingConfig: { exists: false }
            };
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi(undefined));
            (handler as any).recordProfileUpdates();
            expect((handler as any).mAutoInitReport.changeForConfig).toBe("Created");
            for (const profileReport of (handler as any).mAutoInitReport.profileRpts) {
                expect(profileReport.changeForProf).toBe("Created");
            }
        });

        it("should detect when a profile is created in config", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                profileRpts: profileReports,
                startingConfig: {
                    exists: true,
                    properties: {
                        profiles: {},
                        defaults: {}
                    }
                }
            };
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi({
                profiles: {
                    abcxyz: {
                        type: "fake",
                        properties: {
                            basePath: "abcxyz/api/v1"
                        }
                    }
                },
                defaults: {}
            }));
            (handler as any).recordProfileUpdates();
            expect((handler as any).mAutoInitReport.changeForConfig).toBe("Modified");
            expect((handler as any).mAutoInitReport.profileRpts[0].changeForProf).toBe("Created");
        });

        it("should detect when a profile is removed from config", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                profileRpts: profileReports,
                startingConfig: {
                    exists: true,
                    properties: {
                        profiles: {
                            abcxyz: {
                                type: "fake",
                                properties: {
                                    basePath: "abcxyz/api/v1"
                                }
                            }
                        },
                        defaults: {}
                    }
                }
            };
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi({
                profiles: {},
                defaults: {}
            }));
            (handler as any).recordProfileUpdates();
            expect((handler as any).mAutoInitReport.changeForConfig).toBe("Modified");
            expect((handler as any).mAutoInitReport.profileRpts[0].changeForProf).toBe("Removed");
        });

        it("should detect when a profile is modified in config", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                profileRpts: profileReports,
                startingConfig: {
                    exists: true,
                    path: "fakePath",
                    properties: {
                        profiles: {
                            abcxyz: {
                                type: "fake",
                                properties: {
                                    basePath: "abcxyz/api/v1"
                                }
                            }
                        },
                        defaults: {}
                    }
                }
            };
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi({
                profiles: {
                    abcxyz: {
                        type: "fake",
                        properties: {
                            basePath: "abcxyz/api/v2"
                        }
                    }
                },
                defaults: {}
            }));
            (handler as any).recordProfileUpdates();
            expect((handler as any).mAutoInitReport.changeForConfig).toBe("Modified");
            expect((handler as any).mAutoInitReport.profileRpts[0].changeForProf).toBe("Modified");
        });

        it("should detect when a profile is unchanged in config", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                profileRpts: profileReports,
                startingConfig: {
                    exists: true,
                    properties: {
                        profiles: {
                            abcxyz: {
                                type: "fake",
                                properties: {
                                    basePath: "abcxyz/api/v1"
                                }
                            }
                        },
                        defaults: {}
                    }
                }
            };
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi({
                profiles: {
                    abcxyz: {
                        type: "fake",
                        properties: {
                            basePath: "abcxyz/api/v1"
                        }
                    }
                },
                defaults: {}
            }));
            (handler as any).recordProfileUpdates();
            expect((handler as any).mAutoInitReport.changeForConfig).toBe("No changes to");
            expect((handler as any).mAutoInitReport.profileRpts[0].changeForProf).toBe("No changes to");
        });

        it("should record that an indexed profile has changed", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                profileRpts: [
                    { profName: "zosmf" }
                ]
            };
            (handler as any).recordOneProfChange("zosmf", { type: "zosmf" }, "Modified");
            expect((handler as any).mAutoInitReport.changeForConfig).toBe("Modified");
            expect((handler as any).mAutoInitReport.profileRpts[0].changeForProf).toBe("Modified");
        });

        it("should record that an unindexed profile has changed", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                profileRpts: []
            };
            (handler as any).recordOneProfChange("zosmf", { type: "zosmf" }, "Modified");
            expect((handler as any).mAutoInitReport.changeForConfig).toBe("Modified");
            expect((handler as any).mAutoInitReport.profileRpts[0]).toMatchObject({
                changeForProf: "Modified",
                profName: "zosmf",
                profType: "zosmf",
                basePath: "Not supplied",
                pluginNms: [],
                altProfiles: [],
                baseOverrides: []
            });
        });

        it("should record profile conflicts when default base profile is overridden", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                endingConfig: mockConfigApi({
                    profiles: {
                        abcxyz: {
                            type: "fake",
                            properties: {
                                basePath: "abcxyz/api/v1",
                                port: 443,
                                tokenValue: "serviceToken"
                            }
                        },
                        base: {
                            type: "base",
                            properties: {
                                port: 7554,
                                tokenValue: "baseToken"
                            },
                            secure: ["tokenValue"]
                        }
                    },
                    defaults: { base: "base" }
                }),
                profileRpts: [{
                    changeForProf: "Modified",
                    profName: "abcxyz",
                    baseOverrides: []
                }]
            };
            (handler as any).recordProfileConflictsWithBase();
            expect((handler as any).mAutoInitReport.profileRpts[0].baseOverrides).toEqual([
                {
                    propName: "port",
                    secure: false,
                    priorityValue: 443,
                    baseValue: 7554
                },
                {
                    propName: "tokenValue",
                    secure: true,
                    priorityValue: "serviceToken",
                    baseValue: "baseToken"
                }
            ]);
        });

        it("should not record profile conflicts when default base profile is undefined", () => {
            const lodashGetSpy = jest.spyOn(lodash, "get");
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                endingConfig: mockConfigApi({
                    profiles: {},
                    defaults: {}
                })
            };
            (handler as any).recordProfileConflictsWithBase();
            expect(lodashGetSpy).not.toHaveBeenCalled();
        });

        it("should not record profile conflicts when default base profile is invalid", () => {
            const lodashGetSpy = jest.spyOn(lodash, "get");
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                endingConfig: mockConfigApi({
                    profiles: {},
                    defaults: { base: "base" }
                })
            };
            (handler as any).recordProfileConflictsWithBase();
            expect(lodashGetSpy).toHaveBeenCalledTimes(1);
        });

        it("should not record profile conflicts when default base profile is empty", () => {
            const lodashGetSpy = jest.spyOn(lodash, "get");
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                endingConfig: mockConfigApi({
                    profiles: {
                        abcxyz: {
                            type: "fake",
                            properties: {
                                basePath: "abcxyz/api/v1",
                                port: 443
                            }
                        },
                        base: {
                            type: "base",
                            properties: {}
                        }
                    },
                    defaults: { base: "base" }
                }),
                profileRpts: [{
                    changeForProf: "Modified",
                    profName: "abcxyz",
                    baseOverrides: []
                }]
            };
            (handler as any).recordProfileConflictsWithBase();
            expect(lodashGetSpy).toHaveBeenCalledTimes(2);
            expect((handler as any).mAutoInitReport.profileRpts[0].baseOverrides).toEqual([]);
        });

        it("should display simple auto-init report when no changes were made", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                changeForConfig: "No changes to",
                configFileNm: "fakePath"
            };
            (handler as any).recordProfileUpdates = jest.fn();
            const mockConsoleLog = jest.fn();
            (handler as any).displayAutoInitChanges({
                console: { log: mockConsoleLog }
            });
            expect(mockConsoleLog).toHaveBeenCalledWith("No changes were needed in the existing Zowe configuration file 'fakePath'.");
        });

        it("should display complex auto-init report when changes were made", () => {
            const handler = new ApimlAutoInitHandler();
            (handler as any).mAutoInitReport = {
                profileRpts: [{
                    changeForProf: "Modified",
                    profName: "abcxyz",
                    profType: "fake",
                    basePath: "abcxyz/api/v1",
                    pluginNms: ["@abc/xyz-for-zowe-cli"],
                    altProfiles: [{
                        altProfName: "defxyz",
                        altProfType: "fake",
                        altBasePath: "defxyz/api/v1"
                    }],
                    baseOverrides: []
                }],
                startingConfig: {
                    exists: true,
                    properties: {
                        profiles: {
                            abcxyz: {
                                type: "fake",
                                properties: {
                                    port: 443
                                }
                            },
                            base: {
                                type: "base",
                                properties: {}
                            }
                        },
                        defaults: {}
                    }
                }
            };
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue(mockConfigApi({
                profiles: {
                    abcxyz: {
                        type: "fake",
                        properties: {
                            basePath: "abcxyz/api/v1",
                            port: 443,
                            tokenValue: "serviceToken"
                        },
                        secure: ["host", "tokenValue"]
                    },
                    defxyz: {
                        type: "fake",
                        properties: {
                            basePath: "defxyz/api/v1"
                        }
                    },
                    base: {
                        type: "base",
                        properties: {
                            port: 7554,
                            tokenValue: "baseToken"
                        },
                        secure: ["host", "tokenValue"]
                    }
                },
                defaults: {
                    base: "base",
                    fake: "abcxyz"
                }
            }));
            let output: string = "";
            const mockConsoleLog = jest.fn((s: string) => output += stripAnsi(s));
            (handler as any).displayAutoInitChanges({
                console: { log: mockConsoleLog }
            });
            expect(mockConsoleLog).toHaveBeenCalled();
            const expectedLines = [
                "Modified the Zowe configuration file 'fakePath'",
                "Modified default profile 'abcxyz' of type 'fake' with basePath 'abcxyz/api/v1'",
                "Packages that use profile type 'fake': @abc/xyz-for-zowe-cli",
                "Alternate profiles of type 'fake': defxyz",
                "host: secure value may override profile 'base'",
                "port: '443' overrides '7554' in profile 'base'",
                "tokenValue: secure value overrides profile 'base'",
                "Created alternate profile 'defxyz' of type 'fake' with basePath 'defxyz/api/v1'",
                "Modified default profile 'base' of type 'base'",
                "You can edit this configuration file to change your Zowe configuration"
            ];
            for (const line of expectedLines) {
                expect(output).toContain(line);
            }
        });
    });
});
