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

jest.mock("../../logger/src/LoggerUtils");
import { AbstractAuthHandler } from "../../imperative";
import { SessConstants } from "../../rest";
import { ImperativeConfig } from "../../utilities";
import { ConfigAutoStore } from "../src/ConfigAutoStore";
import { setupConfigToLoad } from "../../../__tests__/src/TestUtil";

describe("ConfigAutoStore tests", () => {
    beforeAll(() => {
        const baseProfileConfig: any = {
            type: "base",
            authConfig: [
                {
                    handler: __dirname + "/../../imperative/src/auth/__tests__/__data__/FakeAuthHandler"
                }
            ],
            schema: {
                properties: {
                    host: { type: "string" },
                    user: { type: "string", secure: true },
                    password: { type: "string", secure: true },
                    protocol: { type: "string" },
                    tokenType: { type: "string" },
                    tokenValue: { type: "string", secure: true }
                }
            }
        };
        jest.spyOn(ImperativeConfig.instance, "loadedConfig", "get").mockReturnValue({
            baseProfile: baseProfileConfig,
            profiles: [
                {
                    type: "fruit",
                    schema: baseProfileConfig.schema
                },
                baseProfileConfig
            ]
        });
    });

    describe("findAuthHandlerForProfile", () => {
        it("should be able to find auth handler for base profile", async () => {
            await setupConfigToLoad({
                profiles: {
                    base: {
                        type: "base",
                        properties: {
                            tokenType: SessConstants.TOKEN_TYPE_JWT
                        }
                    }
                },
                defaults: { base: "base" }
            });

            const authHandler = ConfigAutoStore.findAuthHandlerForProfile("profiles.base", {} as any);
            expect(authHandler).toBeDefined();
            expect(authHandler instanceof AbstractAuthHandler).toBe(true);
        });

        it("should be able to find auth handler for base profile with a dynamic APIML token type", async () => {
            await setupConfigToLoad({
                profiles: {
                    base: {
                        type: "base",
                        properties: {
                            tokenType: SessConstants.TOKEN_TYPE_APIML + ".1"
                        }
                    }
                },
                defaults: { base: "base" }
            });

            const authHandler = ConfigAutoStore.findAuthHandlerForProfile("profiles.base", {} as any);
            expect(authHandler).toBeDefined();
            expect(authHandler instanceof AbstractAuthHandler).toBe(true);
        });

        it("should  not be able to find auth handler for base profile with a dynamic JWT token type", async () => {
            await setupConfigToLoad({
                profiles: {
                    base: {
                        type: "base",
                        properties: {
                            tokenType: SessConstants.TOKEN_TYPE_JWT + ".1"
                        }
                    }
                },
                defaults: { base: "base" }
            });

            const authHandler = ConfigAutoStore.findAuthHandlerForProfile("profiles.base", {} as any);
            expect(authHandler).toBeUndefined();
        });

        it("should be able to find auth handler for service profile", async () => {
            await setupConfigToLoad({
                profiles: {
                    base: {
                        type: "base",
                        properties: {
                            tokenType: SessConstants.TOKEN_TYPE_JWT
                        }
                    },
                    zosmf: {
                        type: "zosmf",
                        properties: {
                            basePath: "/ibmzosmf/api/v1"
                        }
                    }
                },
                defaults: { base: "base", zosmf: "zosmf" }
            });

            const authHandler = ConfigAutoStore.findAuthHandlerForProfile("profiles.zosmf", {} as any);
            expect(authHandler).toBeDefined();
            expect(authHandler instanceof AbstractAuthHandler).toBe(true);
        });

        it("should not find auth handler if profile does not exist", async () => {
            await setupConfigToLoad({
                profiles: {},
                defaults: {}
            });

            const authHandler = ConfigAutoStore.findAuthHandlerForProfile("profiles.base", {} as any);
            expect(authHandler).toBeUndefined();
        });

        it("should not find auth handler if profile type is undefined", async () => {
            await setupConfigToLoad({
                profiles: {
                    base: {
                        properties: {
                            tokenType: SessConstants.TOKEN_TYPE_JWT
                        }
                    }
                },
                defaults: { base: "base" }
            });

            const authHandler = ConfigAutoStore.findAuthHandlerForProfile("profiles.base", {} as any);
            expect(authHandler).toBeUndefined();
        });

        it("should not find auth handler if profile token type is undefined", async () => {
            await setupConfigToLoad({
                profiles: {
                    base: {
                        type: "base",
                        properties: {}
                    }
                },
                defaults: { base: "base" }
            });

            const authHandler = ConfigAutoStore.findAuthHandlerForProfile("profiles.base", {} as any);
            expect(authHandler).toBeUndefined();
        });

        it("should not find auth handler if service profile base path is undefined", async () => {
            await setupConfigToLoad({
                profiles: {
                    base: {
                        type: "base",
                        properties: {
                            tokenType: SessConstants.TOKEN_TYPE_JWT
                        }
                    },
                    zosmf: {
                        type: "zosmf",
                        properties: {}
                    }
                },
                defaults: { base: "base", zosmf: "zosmf" }
            });

            const authHandler = ConfigAutoStore.findAuthHandlerForProfile("profiles.zosmf", {} as any);
            expect(authHandler).toBeUndefined();
        });
    });

    describe("storeSessCfgProps", () => {
        const handlerParams = {
            arguments: {},
            definition: {
                profile: {
                    required: ["fruit"],
                    optional: ["base"]
                }
            },
            response: {
                console: {
                    log: jest.fn()
                }
            }
        };
        let findActiveProfileSpy: any;

        beforeEach(() => {
            findActiveProfileSpy = jest.spyOn(ConfigAutoStore as any, "_findActiveProfile");
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe("basic auth", () => {
            it("should store user and password in base profile with secure array", async () => {
                await setupConfigToLoad({
                    profiles: {
                        fruit: {
                            type: "fruit",
                            properties: {},
                        },
                        base: {
                            type: "base",
                            properties: {
                                host: "example.com"
                            },
                            secure: ["user", "password"]
                        }
                    },
                    defaults: { fruit: "fruit", base: "base" },
                    autoStore: true
                });
                ImperativeConfig.instance.config.save = jest.fn();

                const propsToAdd = {
                    user: "admin",
                    password: "123456"
                };
                await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {
                    hostname: "example.com",
                    type: SessConstants.AUTH_TYPE_BASIC,
                    ...propsToAdd
                }, ["user", "password"]);

                expect(ImperativeConfig.instance.config.save).toHaveBeenCalled();
                expect(ImperativeConfig.instance.config.properties.profiles.base.properties).toMatchObject({
                    host: "example.com",
                    ...propsToAdd
                });
            });

            it("should store user and password in base profile without secure array", async () => {
                await setupConfigToLoad({
                    profiles: {
                        base: {
                            type: "base",
                            properties: {}
                        }
                    },
                    defaults: { base: "base" },
                    autoStore: true
                });
                ImperativeConfig.instance.config.save = jest.fn();

                const propsToAdd = {
                    user: "admin",
                    password: "123456"
                };
                await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {
                    hostname: "example.com",
                    type: SessConstants.AUTH_TYPE_BASIC,
                    ...propsToAdd
                }, ["user", "password"]);

                expect(ImperativeConfig.instance.config.save).toHaveBeenCalled();
                expect(ImperativeConfig.instance.config.properties.profiles.base.properties).toMatchObject(propsToAdd);
            });

            it("should store user and password in service profile with secure array", async () => {
                await setupConfigToLoad({
                    profiles: {
                        fruit: {
                            type: "fruit",
                            properties: {},
                            secure: ["user", "password"]
                        },
                        base: {
                            type: "base",
                            properties: {
                                host: "example.com"
                            }
                        }
                    },
                    defaults: { fruit: "fruit", base: "base" },
                    autoStore: true
                });
                ImperativeConfig.instance.config.save = jest.fn();

                const propsToAdd = {
                    user: "admin",
                    password: "123456"
                };
                await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {
                    hostname: "example.com",
                    type: SessConstants.AUTH_TYPE_BASIC,
                    ...propsToAdd
                }, ["user", "password"]);

                expect(ImperativeConfig.instance.config.save).toHaveBeenCalled();
                expect(ImperativeConfig.instance.config.properties.profiles.fruit.properties).toMatchObject(propsToAdd);
            });

            it("should store user and password in service profile without secure array", async () => {
                await setupConfigToLoad({
                    profiles: {
                        fruit: {
                            type: "fruit",
                            properties: {}
                        }
                    },
                    defaults: { fruit: "fruit" },
                    autoStore: true
                });
                ImperativeConfig.instance.config.save = jest.fn();

                const propsToAdd = {
                    user: "admin",
                    password: "123456"
                };
                await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {
                    hostname: "example.com",
                    type: SessConstants.AUTH_TYPE_BASIC,
                    ...propsToAdd
                }, ["user", "password"]);

                expect(ImperativeConfig.instance.config.save).toHaveBeenCalled();
                expect(ImperativeConfig.instance.config.properties.profiles.fruit.properties).toMatchObject(propsToAdd);
            });

            it("should store user and password in service profile when config is empty", async () => {
                await setupConfigToLoad({
                    profiles: {},
                    defaults: {},
                    autoStore: true
                });
                ImperativeConfig.instance.config.save = jest.fn();

                const propsToAdd = {
                    user: "admin",
                    password: "123456"
                };
                await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {
                    hostname: "example.com",
                    type: SessConstants.AUTH_TYPE_BASIC,
                    ...propsToAdd
                }, ["user", "password"]);

                expect(ImperativeConfig.instance.config.save).toHaveBeenCalled();
                expect(ImperativeConfig.instance.config.properties.profiles.fruit.properties).toMatchObject(propsToAdd);
            });

            it("should store user and password in top level profile", async () => {
                await setupConfigToLoad({
                    profiles: {
                        fruit: {
                            type: "fruit",
                            profiles: {
                                apple: {
                                    type: "apple",
                                    properties: {}
                                }
                            },
                            properties: {},
                            secure: ["user", "password"]
                        },
                        base: {
                            type: "base",
                            properties: {
                                host: "example.com"
                            }
                        }
                    },
                    defaults: { fruit: "fruit.apple", base: "base" },
                    autoStore: true
                });
                ImperativeConfig.instance.config.save = jest.fn();

                const propsToAdd = {
                    user: "admin",
                    password: "123456"
                };
                await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {
                    hostname: "example.com",
                    type: SessConstants.AUTH_TYPE_BASIC,
                    ...propsToAdd
                }, ["user", "password"]);

                expect(ImperativeConfig.instance.config.save).toHaveBeenCalled();
                expect(ImperativeConfig.instance.config.properties.profiles.fruit.properties).toMatchObject(propsToAdd);
            });
        });

        describe("token auth", () => {
            it("should store token value in base profile", async () => {
                await setupConfigToLoad({
                    profiles: {
                        fruit: {
                            type: "fruit",
                            properties: {
                                basePath: "/apple/api/v1"
                            },
                        },
                        base: {
                            type: "base",
                            properties: {
                                host: "example.com",
                                tokenType: SessConstants.TOKEN_TYPE_JWT
                            },
                            secure: ["tokenValue"]
                        }
                    },
                    defaults: { fruit: "fruit", base: "base" },
                    autoStore: true
                });
                ImperativeConfig.instance.config.save = jest.fn();

                const propsToAdd = {
                    user: "admin",
                    password: "123456"
                };
                await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {
                    hostname: "example.com",
                    type: SessConstants.AUTH_TYPE_BASIC,
                    ...propsToAdd
                }, ["user", "password"]);

                expect(ImperativeConfig.instance.config.save).toHaveBeenCalled();
                expect(ImperativeConfig.instance.config.properties.profiles.base.properties).toMatchObject({
                    host: "example.com",
                    tokenType: SessConstants.TOKEN_TYPE_JWT,
                    tokenValue: "fakeToken"
                });
            });

            it("should store token value in service profile", async () => {
                await setupConfigToLoad({
                    profiles: {
                        fruit: {
                            type: "fruit",
                            properties: {
                                basePath: "/apple/api/v1",
                                tokenType: SessConstants.TOKEN_TYPE_JWT
                            },
                        },
                        base: {
                            type: "base",
                            properties: {
                                host: "example.com"
                            }
                        }
                    },
                    defaults: { fruit: "fruit", base: "base" },
                    autoStore: true
                });
                ImperativeConfig.instance.config.save = jest.fn();

                const propsToAdd = {
                    user: "admin",
                    password: "123456"
                };
                await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {
                    hostname: "example.com",
                    type: SessConstants.AUTH_TYPE_BASIC,
                    ...propsToAdd
                }, ["user", "password"]);

                expect(ImperativeConfig.instance.config.save).toHaveBeenCalled();
                expect(ImperativeConfig.instance.config.properties.profiles.fruit.properties).toMatchObject({
                    tokenType: SessConstants.TOKEN_TYPE_JWT,
                    tokenValue: "fakeToken"
                });
                expect(ImperativeConfig.instance.config.properties.profiles.fruit.secure).toEqual(["tokenValue"]);
            });
        });

        it("should store host securely in top level profile", async () => {
            await setupConfigToLoad({
                profiles: {
                    fruit: {
                        type: "fruit",
                        profiles: {
                            apple: {
                                type: "apple",
                                properties: {}
                            }
                        },
                        properties: {},
                        secure: ["host"]
                    }
                },
                defaults: { fruit: "fruit.apple" },
                autoStore: true
            });
            ImperativeConfig.instance.config.save = jest.fn();

            await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {
                hostname: "example.com",
                type: SessConstants.AUTH_TYPE_BASIC,
                protocol: "https"
            }, ["hostname", "protocol"]);

            expect(ImperativeConfig.instance.config.save).toHaveBeenCalled();
            expect(ImperativeConfig.instance.config.properties.profiles.fruit.properties).toMatchObject({ host: "example.com" });
            expect(ImperativeConfig.instance.config.properties.profiles.fruit.profiles.apple.properties).toMatchObject({ protocol: "https" });
        });

        it("should do nothing if property list is empty", async () => {
            await ConfigAutoStore.storeSessCfgProps(null, {}, []);
            expect(findActiveProfileSpy).not.toHaveBeenCalled();
        });

        it("should do nothing if team config does not exist", async () => {
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue({ exists: false } as any);
            await ConfigAutoStore.storeSessCfgProps(null, {}, ["host"]);
            expect(findActiveProfileSpy).not.toHaveBeenCalled();
        });

        it("should do nothing if team config has auto-store disabled", async () => {
            await setupConfigToLoad({
                profiles: {},
                defaults: {},
                autoStore: false
            });
            await ConfigAutoStore.storeSessCfgProps(null, {}, ["host"]);
            expect(findActiveProfileSpy).not.toHaveBeenCalled();
        });

        it("should do nothing if no active profile is found", async () => {
            await setupConfigToLoad({
                profiles: {},
                defaults: {},
                autoStore: true
            });
            ImperativeConfig.instance.config.save = jest.fn();

            await ConfigAutoStore.storeSessCfgProps(handlerParams as any, {}, ["host", "hostess"]);
            expect(findActiveProfileSpy).toHaveBeenCalled();
            expect(ImperativeConfig.instance.config.save).not.toHaveBeenCalled();
        });
    });

    describe("findActiveProfile", () => {
        it("should find profile in command arguments", async () => {
            await setupConfigToLoad({
                profiles: {
                    apple: {
                        type: "fruit",
                        properties: {}
                    }
                },
                defaults: { fruit: "apple" }
            });

            const handlerParams = {
                arguments: {
                    "fruit-profile": "orange"
                },
                definition: {
                    profile: {
                        required: ["fruit"],
                        optional: ["base"]
                    }
                }
            };

            const profileData = ConfigAutoStore.findActiveProfile(handlerParams as any, ["host"]);
            expect(profileData).toEqual(["fruit", "orange"]);
        });

        it("should find profile in config properties", async () => {
            await setupConfigToLoad({
                profiles: {
                    apple: {
                        type: "fruit",
                        properties: {}
                    }
                },
                defaults: { fruit: "apple" }
            });

            const handlerParams = {
                arguments: {},
                definition: {
                    profile: {
                        required: ["fruit"],
                        optional: ["base"]
                    }
                }
            };

            const profileData = ConfigAutoStore.findActiveProfile(handlerParams as any, ["host"]);
            expect(profileData).toEqual(["fruit", "apple"]);
        });

        it("should fall back to default profile name", async () => {
            await setupConfigToLoad({
                profiles: {},
                defaults: {}
            });

            const handlerParams = {
                arguments: {},
                definition: {
                    profile: {
                        required: ["fruit"],
                        optional: ["base"]
                    }
                }
            };

            const profileData = ConfigAutoStore.findActiveProfile(handlerParams as any, ["host"]);
            expect(profileData).toEqual(["fruit", "fruit"]);
        });

        it("should not find profile if missing from command definition", async () => {
            await setupConfigToLoad({
                profiles: {},
                defaults: {}
            });

            const handlerParams = {
                arguments: {},
                definition: {
                    profile: {}
                }
            };

            const profileData = ConfigAutoStore.findActiveProfile(handlerParams as any, ["host"]);
            expect(profileData).toBeUndefined();
        });

        it("should not find profile if schema is missing required properties", async () => {
            await setupConfigToLoad({
                profiles: {},
                defaults: {}
            });

            const handlerParams = {
                arguments: {},
                definition: {
                    profile: {
                        required: ["fruit"],
                        optional: ["base"]
                    }
                }
            };

            const profileData = ConfigAutoStore.findActiveProfile(handlerParams as any, ["host", "hostess"]);
            expect(profileData).toBeUndefined();
        });
    });

    describe("fetchTokenForSessCfg", () => {
        it("should fetch token when auth handler is found", async () => {
            const mockLoginHandler = jest.fn();
            jest.spyOn(ConfigAutoStore as any, "_findAuthHandlerForProfile").mockReturnValueOnce({
                getAuthHandlerApi: () => ({
                    promptParams: { defaultTokenType: SessConstants.TOKEN_TYPE_JWT },
                    sessionLogin: mockLoginHandler
                })
            } as any);

            const fetched = await (ConfigAutoStore as any).fetchTokenForSessCfg({}, {
                hostname: "example.com",
                user: "admin",
                password: "123456"
            }, null);

            expect(fetched).toBe(true);
            expect(mockLoginHandler).toHaveBeenCalled();
            expect((mockLoginHandler.mock.calls[0][0] as any).ISession).toMatchObject({
                hostname: "example.com",
                type: SessConstants.AUTH_TYPE_TOKEN,
                tokenType: SessConstants.TOKEN_TYPE_JWT
            });
        });

        it("should do nothing when auth handler is not found", async () => {
            jest.spyOn(ConfigAutoStore as any, "_findAuthHandlerForProfile").mockReturnValueOnce(undefined);

            const fetched = await (ConfigAutoStore as any).fetchTokenForSessCfg({}, {}, null);

            expect(fetched).toBe(false);
        });
    });
});
