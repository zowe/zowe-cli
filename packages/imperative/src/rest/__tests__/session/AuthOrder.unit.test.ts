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

import { AuthOrder, PropUse } from "../../src/session/AuthOrder";
import { ISession } from "../../src/session/doc/ISession";
import {
    AUTH_TYPE_CHOICES, AUTH_TYPE_NONE, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER,
    AUTH_TYPE_TOKEN, AUTH_TYPE_CERT_PEM
} from "../../src/session/SessConstants";
import { Logger } from "../../../../src/logger/src/Logger";
import { ImperativeError } from "../../../../src/error/src/ImperativeError";
import { Config } from "../../../../src/config";

describe("AuthOrder", () => {
    const cmdArgUserVal = "cmdArgUser";
    const cmdArgPassVal = "cmdArgPassword";
    const cmdArgsB64AuthVal = "cmdArgsB64Auth";
    const cmdsArgsApimlAuthTokenTypeVal = "cmdsArgsApimlAuthTokenType";
    const cmdArgsTokenValueVal = "cmdArgsTokenValue";
    const cmdsArgsCertFileVal = "./cmdsArgsCertFile.txt";
    const cmdsArgsCertKeyFileVal = "./cmdsArgsCertKeyFile.txt";
    const startingCmdArgs = {
        "protocol": "https",
        "hostname": "TestHostName",
        "port": 1234,
        "authOrder": "",
        "user": cmdArgUserVal,
        "password": cmdArgPassVal,
        "base64EncodedAuth": cmdArgsB64AuthVal,
        "tokenType": cmdsArgsApimlAuthTokenTypeVal,
        "tokenValue": cmdArgsTokenValueVal,
        "certFile": cmdsArgsCertFileVal,
        "certKeyFile": cmdsArgsCertKeyFileVal,
        "$0": "test",
        "_": ["test"]
    };
    let cmdArgsForTest: any;

    // Create a session config
    const sessCertPropNm = "cert";
    const sessCertKeyPropNm = "certKey";
    const sessCfgUserVal = "sessCfgUser";
    const sessCfgPassVal = "sessCfgPassword";
    const startingSessCfg: ISession = {
        type: AUTH_TYPE_BASIC,
        hostname: "fake_host",
        port: 1234,
        user: sessCfgUserVal,
        password: sessCfgPassVal
    };
    let sessCfgForTest: ISession;

    let logMsg: string = "";

    beforeEach(() => {
        // record log messages into a string for testing
        jest.spyOn(Logger, "getImperativeLogger").mockImplementation(() => {
            return {
                error: jest.fn((errMsg) => {
                    logMsg = errMsg;
                }),
                warn: jest.fn((errMsg) => {
                    logMsg = errMsg;
                }),
                info: jest.fn((errMsg) => {
                    logMsg = errMsg;
                }),
                debug: jest.fn((errMsg) => {
                    logMsg = errMsg;
                })
            } as any;
        });

        cmdArgsForTest = { ...startingCmdArgs };
        sessCfgForTest = { ...startingSessCfg };

        // create an authCache item for this session using a private static method
        AuthOrder["findOrCreateAuthCache"](sessCfgForTest);
    });

    afterEach(() => {
        jest.clearAllMocks();    // clear our spies usage counts
        jest.restoreAllMocks();  // spies back to original app implementation
        logMsg = "";
    });

    describe("cacheAuthOrder", () => {
        it("should cache a supplied auth order", () => {
            cmdArgsForTest.authOrder = "cert-pem,basic,bearer,token,none";
            const expectedAuthOrder = [
                AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER, AUTH_TYPE_TOKEN, AUTH_TYPE_NONE
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            const retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(expectedAuthOrder);
            expect(sessCfgForTest).toHaveProperty("_authCache");
            expect(sessCfgForTest._authCache?.didUserSetAuthOrder).toBe(true);
        });

        it("should remove duplicates from auth order", () => {
            cmdArgsForTest.authOrder = "cert-pem,basic,bearer,token,none,cert-pem,basic,bearer,token,none";
            const expectedAuthOrder = [
                AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER, AUTH_TYPE_TOKEN, AUTH_TYPE_NONE
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            const retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(expectedAuthOrder);
        });

        it("should cache an auth order with spaces", () => {
            cmdArgsForTest.authOrder = " cert-pem ,  basic ,  bearer ,  token ,  token ,  none  ";
            const expectedAuthOrder = [
                AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER, AUTH_TYPE_TOKEN, AUTH_TYPE_NONE
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            const retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(expectedAuthOrder);
        });

        it("should remove invalid auth names", () => {
            cmdArgsForTest.authOrder = "cert-pem, basic, bogusAuth1, bearer, token, bogusAuth2, token, none  ";
            const expectedAuthOrder = [
                AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER, AUTH_TYPE_TOKEN, AUTH_TYPE_NONE
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            const retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(expectedAuthOrder);
        });

        it("should use a default order when authOrder is empty", () => {
            cmdArgsForTest.authOrder = "";
            const expectedDefaultAuthOrder = [
                AUTH_TYPE_BASIC, AUTH_TYPE_TOKEN, AUTH_TYPE_BEARER, AUTH_TYPE_CERT_PEM
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            const retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(expectedDefaultAuthOrder);
        });

        it("should use a default order when authOrder not supplied", () => {
            delete cmdArgsForTest.authOrder;
            const expectedDefaultAuthOrder = [
                AUTH_TYPE_BASIC, AUTH_TYPE_TOKEN, AUTH_TYPE_BEARER, AUTH_TYPE_CERT_PEM
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            const retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(expectedDefaultAuthOrder);
        });

        it("should use a default order when only invalid values are supplied", () => {
            cmdArgsForTest.authOrder = "BogusAuth1, BogusAuth2, BogusAuth3";
            const expectedDefaultAuthOrder = [
                AUTH_TYPE_BASIC, AUTH_TYPE_TOKEN, AUTH_TYPE_BEARER, AUTH_TYPE_CERT_PEM
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            const retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(expectedDefaultAuthOrder);
        });

        it("should use a default order and log a warning when authOrder is not a string", () => {
            cmdArgsForTest.authOrder = 666;
            const expectedDefaultAuthOrder = [
                AUTH_TYPE_BASIC, AUTH_TYPE_TOKEN, AUTH_TYPE_BEARER, AUTH_TYPE_CERT_PEM
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            const retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(expectedDefaultAuthOrder);
            expect(logMsg).toContain(
                "The authOrder option = '666' is not a valid authOrder string. A default authOrder will be used."
            );
        });

        it("should use a default order with token at top when requested", () => {
            cmdArgsForTest.authOrder = "BogusAuth";
            const expectedDefaultAuthOrder = [
                AUTH_TYPE_TOKEN, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER, AUTH_TYPE_CERT_PEM
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            AuthOrder.cacheDefaultAuthOrder(sessCfgForTest, AUTH_TYPE_TOKEN);
            const retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(expectedDefaultAuthOrder);
            expect(logMsg).toContain(
                "The authentication = 'BogusAuth' is not valid and will be ignored."
            );
        });

        it("should permit multiple calls to cacheAuthOrder", () => {
            cmdArgsForTest.authOrder = "cert-pem,basic,bearer,token,none";
            let authOrder = [
                AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER, AUTH_TYPE_TOKEN, AUTH_TYPE_NONE
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            let retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder.length).toEqual(5);
            expect(retrievedAuthOrder).toEqual(authOrder);
            expect(sessCfgForTest).toHaveProperty("_authCache");
            expect(sessCfgForTest._authCache?.didUserSetAuthOrder).toBe(true);

            // cache the auth order for this session a second time
            if (sessCfgForTest._authCache?.didUserSetAuthOrder) {
                sessCfgForTest._authCache.didUserSetAuthOrder = false;
            }
            cmdArgsForTest.authOrder = "token,basic";
            authOrder  = [AUTH_TYPE_TOKEN, AUTH_TYPE_BASIC];

            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder.length).toEqual(2);
            expect(retrievedAuthOrder).toEqual(authOrder);
            expect(sessCfgForTest).toHaveProperty("_authCache");
            expect(sessCfgForTest._authCache?.didUserSetAuthOrder).toBe(true);
        });

        it("should not reset authOrder if it was set by a user", () => {
            cmdArgsForTest.authOrder = "cert-pem,basic,bearer,token,none";
            const userAuthOrder = [
                AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER, AUTH_TYPE_TOKEN, AUTH_TYPE_NONE
            ];

            // cache the auth order for this session using a private static method
            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            let retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder).toEqual(userAuthOrder);
            expect(sessCfgForTest).toHaveProperty("_authCache");
            expect(sessCfgForTest._authCache?.didUserSetAuthOrder).toBe(true);

            // record that this authOrder was set by a user
            if (sessCfgForTest._authCache?.didUserSetAuthOrder) {
                sessCfgForTest._authCache.didUserSetAuthOrder = true;
            }

            // cache an auth order for this session a second time
            // the authOrder count should remain at 5 not reduced to 2
            cmdArgsForTest.authOrder = "token,basic";

            AuthOrder["cacheAuthOrder"](sessCfgForTest, cmdArgsForTest);
            retrievedAuthOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(retrievedAuthOrder.length).toEqual(5);
            expect(retrievedAuthOrder).toEqual(userAuthOrder);
            expect(sessCfgForTest).toHaveProperty("_authCache");
            expect(sessCfgForTest._authCache?.didUserSetAuthOrder).toBe(true);
        });
    });

    describe("getAuthOrder", () => {
        it("should return a default auth order if one does not exist", () => {
            delete sessCfgForTest.authTypeOrder;
            const authOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(authOrder.length).toEqual(4);
            expect(authOrder[0]).toEqual(AUTH_TYPE_BASIC);
            expect(authOrder[1]).toEqual(AUTH_TYPE_TOKEN);
            expect(authOrder[2]).toEqual(AUTH_TYPE_BEARER);
            expect(authOrder[3]).toEqual(AUTH_TYPE_CERT_PEM);
        });

        it("should return a default auth order if existing one is empty", () => {
            sessCfgForTest.authTypeOrder = [];
            const authOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(authOrder.length).toEqual(4);
            expect(authOrder[0]).toEqual(AUTH_TYPE_BASIC);
            expect(authOrder[1]).toEqual(AUTH_TYPE_TOKEN);
            expect(authOrder[2]).toEqual(AUTH_TYPE_BEARER);
            expect(authOrder[3]).toEqual(AUTH_TYPE_CERT_PEM);
        });

        it("should return a pre-set auth order", () => {
            sessCfgForTest.authTypeOrder = [AUTH_TYPE_CERT_PEM, AUTH_TYPE_TOKEN, AUTH_TYPE_BASIC];
            const authOrder = AuthOrder.getAuthOrder(sessCfgForTest);
            expect(authOrder.length).toEqual(3);
            expect(authOrder[0]).toEqual(AUTH_TYPE_CERT_PEM);
            expect(authOrder[1]).toEqual(AUTH_TYPE_TOKEN);
            expect(authOrder[2]).toEqual(AUTH_TYPE_BASIC);
        });
    });

    describe("cacheCred", () => {
        it("should cache a cred from sessCfg when it is in both cmdArgs and sessCfg", () => {
            const credName = "password";
            AuthOrder["cacheCred"](credName, sessCfgForTest, cmdArgsForTest);
            expect(sessCfgForTest._authCache?.availableCreds[credName]).toEqual(cmdArgPassVal);
        });

        it("should cache a cred from cmdArgs when it is NOT in sessCfg", () => {
            const credName = "password";
            delete sessCfgForTest[credName];

            AuthOrder["cacheCred"](credName, sessCfgForTest, cmdArgsForTest);
            expect((sessCfgForTest as any)._authCache.availableCreds[credName]).toEqual(cmdArgPassVal);
        });
    });

    describe("clearAuthCache", () => {
        it("should clear the authentication cache", () => {
            cmdArgsForTest.authOrder = "cert-pem,basic,bearer,token,none";

            // create a cache to setup our test
            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            expect(sessCfgForTest._authCache?.availableCreds["user"]).toEqual(cmdArgUserVal);
            expect(sessCfgForTest._authCache?.availableCreds["password"]).toEqual(cmdArgPassVal);
            expect(sessCfgForTest._authCache?.availableCreds["base64EncodedAuth"]).toEqual(cmdArgsB64AuthVal);
            expect(sessCfgForTest._authCache?.availableCreds["tokenType"]).toEqual(cmdsArgsApimlAuthTokenTypeVal);
            expect(sessCfgForTest._authCache?.availableCreds["tokenValue"]).toEqual(cmdArgsTokenValueVal);
            expect(sessCfgForTest._authCache?.availableCreds[sessCertPropNm]).toEqual(cmdsArgsCertFileVal);
            expect(sessCfgForTest._authCache?.availableCreds[sessCertKeyPropNm]).toEqual(cmdsArgsCertKeyFileVal);

            AuthOrder.clearAuthCache(sessCfgForTest);
            expect(Object.keys((sessCfgForTest as any)._authCache.availableCreds).length).toEqual(0);
            expect(sessCfgForTest._authCache?.didUserSetAuthOrder).toEqual(false);
            expect(sessCfgForTest._authCache?.topDefaultAuth).toEqual(undefined);
            expect(sessCfgForTest._authCache).not.toHaveProperty("authTypeToRequestToken");
        });
    });

    describe("cacheDefaultAuthOrder", () => {
        it("should place basic first when asked", () => {
            AuthOrder.cacheDefaultAuthOrder(sessCfgForTest, AUTH_TYPE_BASIC);

            // confirm that basic comes first
            expect(sessCfgForTest).toHaveProperty("authTypeOrder");
            expect(sessCfgForTest.authTypeOrder?.length).toEqual(4);
            expect((sessCfgForTest as any).authTypeOrder[0]).toEqual(AUTH_TYPE_BASIC);
            expect((sessCfgForTest as any).authTypeOrder[1]).toEqual(AUTH_TYPE_TOKEN);
            expect((sessCfgForTest as any).authTypeOrder[2]).toEqual(AUTH_TYPE_BEARER);
            expect((sessCfgForTest as any).authTypeOrder[3]).toEqual(AUTH_TYPE_CERT_PEM);
        });

        it("should place token first when asked", () => {
            AuthOrder.cacheDefaultAuthOrder(sessCfgForTest, AUTH_TYPE_TOKEN);

            // confirm that token comes first
            expect(sessCfgForTest).toHaveProperty("authTypeOrder");
            expect(sessCfgForTest.authTypeOrder?.length).toEqual(4);
            expect((sessCfgForTest as any).authTypeOrder[0]).toEqual(AUTH_TYPE_TOKEN);
            expect((sessCfgForTest as any).authTypeOrder[1]).toEqual(AUTH_TYPE_BASIC);
            expect((sessCfgForTest as any).authTypeOrder[2]).toEqual(AUTH_TYPE_BEARER);
            expect((sessCfgForTest as any).authTypeOrder[3]).toEqual(AUTH_TYPE_CERT_PEM);
        });

        it("should not overwrite an auth order set by the user", () => {
            sessCfgForTest.authTypeOrder = [AUTH_TYPE_CERT_PEM, AUTH_TYPE_NONE];
            sessCfgForTest._authCache = {
                availableCreds: {
                    user: "preSetUser",
                    password: "preSetPassword"
                },
                didUserSetAuthOrder: true,
                topDefaultAuth: AUTH_TYPE_TOKEN
            };

            AuthOrder.cacheDefaultAuthOrder(sessCfgForTest, AUTH_TYPE_TOKEN);

            // confirm that the user order remains in place
            expect(sessCfgForTest).toHaveProperty("authTypeOrder");
            expect(sessCfgForTest.authTypeOrder.length).toEqual(2);
            expect(sessCfgForTest.authTypeOrder[0]).toEqual(AUTH_TYPE_CERT_PEM);
            expect(sessCfgForTest.authTypeOrder[1]).toEqual(AUTH_TYPE_NONE);
            expect(logMsg).toContain(
                "Because user set authOrder, an attempt to put token at the top of the order was ignored"
            );
        });
    });

    describe("chooseDefaultAuthOrder", () => {
        it("should take no action if the user set auth order", () => {
            // create an authCache item for this session with an auth order set by the user
            sessCfgForTest.authTypeOrder = [AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC];
            sessCfgForTest._authCache = {
                availableCreds: {
                    user: "preSetUser",
                    password: "preSetPassword"
                },
                didUserSetAuthOrder: true,
                topDefaultAuth: AUTH_TYPE_TOKEN
            };

            // try to set the token default order for this session using a private static method
            AuthOrder["chooseDefaultAuthOrder"](sessCfgForTest);

            // confirm that the top default auth remains in place
            expect(sessCfgForTest._authCache.topDefaultAuth).toEqual(AUTH_TYPE_TOKEN);
            expect(sessCfgForTest).toHaveProperty("authTypeOrder");
            expect(sessCfgForTest.authTypeOrder.length).toEqual(2);
            expect(sessCfgForTest.authTypeOrder[0]).toEqual(AUTH_TYPE_CERT_PEM);
            expect(sessCfgForTest.authTypeOrder[1]).toEqual(AUTH_TYPE_BASIC);
        });

        it("should set top default auth to token as asked when user never sets auth order", () => {
            // create an authCache item for this session with no auth order set by the user
            sessCfgForTest.authTypeOrder = [AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC];
            sessCfgForTest._authCache = {
                availableCreds: {
                    user: "preSetUser",
                    password: "preSetPassword"
                },
                didUserSetAuthOrder: false,
                topDefaultAuth: AUTH_TYPE_TOKEN
            };

            // try to set the token default order for this session using a private static method
            AuthOrder["chooseDefaultAuthOrder"](sessCfgForTest);

            // confirm that the auth order changed to a default with token at the top
            expect(sessCfgForTest).toHaveProperty("authTypeOrder");
            expect(sessCfgForTest.authTypeOrder?.length).toEqual(4);
            expect((sessCfgForTest as any).authTypeOrder[0]).toEqual(AUTH_TYPE_TOKEN);
            expect((sessCfgForTest as any).authTypeOrder[1]).toEqual(AUTH_TYPE_BASIC);
            expect((sessCfgForTest as any).authTypeOrder[2]).toEqual(AUTH_TYPE_BEARER);
            expect((sessCfgForTest as any).authTypeOrder[3]).toEqual(AUTH_TYPE_CERT_PEM);
        });
    });

    describe("makingRequestForToken", () => {
        it("should place AUTH_TYPE_NONE into authTypeToRequestToken", () => {
            AuthOrder.makingRequestForToken(sessCfgForTest);
            expect(sessCfgForTest._authCache?.authTypeToRequestToken).toEqual(AUTH_TYPE_NONE);
        });
    });

    describe("removeRequestForToken", () => {
        it("should remove authTypeToRequestToken from a session config", () => {
            sessCfgForTest._authCache = {
                availableCreds: {
                    user: "preSetUser",
                    password: "preSetPassword"
                },
                didUserSetAuthOrder: true,
                topDefaultAuth: AUTH_TYPE_TOKEN,
                authTypeToRequestToken: AUTH_TYPE_BASIC
            };

            expect(sessCfgForTest._authCache.authTypeToRequestToken).toEqual(AUTH_TYPE_BASIC);
            AuthOrder.removeRequestForToken(sessCfgForTest);
            expect(sessCfgForTest._authCache).not.toHaveProperty("authTypeToRequestToken");
        });

        it("should do nothing if _authCache does not exist", () => {
            delete sessCfgForTest._authCache;
            let thrownError: any;
            try {
                AuthOrder.removeRequestForToken(sessCfgForTest);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).not.toBeDefined();
        });

        it("should do nothing if the session config does not exist", () => {
            delete sessCfgForTest._authCache;
            let thrownError: any;
            try {
                AuthOrder.removeRequestForToken(null as any);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).not.toBeDefined();
        });
    });

    describe("addCredsToSession", () => {
        it("should cache both available creds and authOrder", () => {
            cmdArgsForTest.authOrder = "cert-pem,basic,bearer,token,none";
            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);

            // confirm that auth order was recorded
            expect(sessCfgForTest).toHaveProperty("authTypeOrder");
            expect(sessCfgForTest.authTypeOrder?.length).toEqual(5);
            expect((sessCfgForTest as any).authTypeOrder[0]).toEqual(AUTH_TYPE_CERT_PEM);
            expect((sessCfgForTest as any).authTypeOrder[1]).toEqual(AUTH_TYPE_BASIC);
            expect((sessCfgForTest as any).authTypeOrder[2]).toEqual(AUTH_TYPE_BEARER);
            expect((sessCfgForTest as any).authTypeOrder[3]).toEqual(AUTH_TYPE_TOKEN);
            expect((sessCfgForTest as any).authTypeOrder[4]).toEqual(AUTH_TYPE_NONE);

            expect(sessCfgForTest).toHaveProperty("_authCache");
            expect(sessCfgForTest._authCache).toHaveProperty("didUserSetAuthOrder");
            expect(sessCfgForTest._authCache?.didUserSetAuthOrder).toEqual(true);

            // confirm that all available creds have been recorded
            expect(sessCfgForTest._authCache).toHaveProperty("availableCreds");
            expect(Object.keys((sessCfgForTest as any)._authCache.availableCreds).length).toEqual(7);
            expect(sessCfgForTest._authCache?.availableCreds["user"]).toEqual(cmdArgUserVal);
            expect(sessCfgForTest._authCache?.availableCreds["password"]).toEqual(cmdArgPassVal);
            expect(sessCfgForTest._authCache?.availableCreds["base64EncodedAuth"]).toEqual(cmdArgsB64AuthVal);
            expect(sessCfgForTest._authCache?.availableCreds["tokenType"]).toEqual(cmdsArgsApimlAuthTokenTypeVal);
            expect(sessCfgForTest._authCache?.availableCreds["tokenValue"]).toEqual(cmdArgsTokenValueVal);
            expect(sessCfgForTest._authCache?.availableCreds[sessCertPropNm]).toEqual(cmdsArgsCertFileVal);
            expect(sessCfgForTest._authCache?.availableCreds[sessCertKeyPropNm]).toEqual(cmdsArgsCertKeyFileVal);
        });

        it("should cache creds and authOrder only from sessCfg when no cmdArgs are supplied", () => {
            AuthOrder.addCredsToSession(sessCfgForTest);

            // confirm that auth order was recorded
            expect(sessCfgForTest).toHaveProperty("authTypeOrder");
            expect(sessCfgForTest.authTypeOrder?.length).toEqual(4);
            expect((sessCfgForTest as any).authTypeOrder[0]).toEqual(AUTH_TYPE_BASIC);
            expect((sessCfgForTest as any).authTypeOrder[1]).toEqual(AUTH_TYPE_TOKEN);
            expect((sessCfgForTest as any).authTypeOrder[2]).toEqual(AUTH_TYPE_BEARER);
            expect((sessCfgForTest as any).authTypeOrder[3]).toEqual(AUTH_TYPE_CERT_PEM);

            expect(sessCfgForTest).toHaveProperty("_authCache");
            expect(sessCfgForTest._authCache).toHaveProperty("didUserSetAuthOrder");
            expect(sessCfgForTest._authCache?.didUserSetAuthOrder).toEqual(false);

            // confirm that only creds from sessCfg have been recorded
            expect(sessCfgForTest._authCache).toHaveProperty("availableCreds");
            expect(Object.keys((sessCfgForTest as any)._authCache.availableCreds).length).toEqual(2);
            expect(sessCfgForTest._authCache?.availableCreds["user"]).toEqual(sessCfgUserVal);
            expect(sessCfgForTest._authCache?.availableCreds["password"]).toEqual(sessCfgPassVal);
            expect(sessCfgForTest._authCache?.availableCreds["base64EncodedAuth"]).not.toBeDefined();
            expect(sessCfgForTest._authCache?.availableCreds["tokenType"]).not.toBeDefined();
            expect(sessCfgForTest._authCache?.availableCreds["tokenValue"]).not.toBeDefined();
            expect(sessCfgForTest._authCache?.availableCreds[sessCertPropNm]).not.toBeDefined();
            expect(sessCfgForTest._authCache?.availableCreds[sessCertKeyPropNm]).not.toBeDefined();
        });

        it("should remove all creds except basic when basic is the top auth order", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_BASIC}, ${AUTH_TYPE_TOKEN}, ${AUTH_TYPE_BEARER}, ${AUTH_TYPE_CERT_PEM}`;
            sessCfgForTest.tokenType = "tokenTypeShouldNotRemain";
            sessCfgForTest.tokenValue = "tokenValueShouldNotRemain";
            sessCfgForTest[sessCertPropNm] = "certShouldNotRemain";
            sessCfgForTest[sessCertKeyPropNm] = "certKeyShouldNotRemain";
            delete sessCfgForTest.user;
            delete sessCfgForTest.password;
            delete sessCfgForTest.base64EncodedAuth;

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_BASIC);
            expect(sessCfgForTest.user).toEqual(cmdArgUserVal);
            expect(sessCfgForTest.password).toEqual(cmdArgPassVal);
            expect(sessCfgForTest.base64EncodedAuth).toEqual(
                Buffer.from(sessCfgForTest.user + ":" + sessCfgForTest.password).toString("base64")
            );
            expect(sessCfgForTest).not.toHaveProperty("tokenType");
            expect(sessCfgForTest).not.toHaveProperty("tokenValue");
            expect(sessCfgForTest).not.toHaveProperty(sessCertPropNm);
            expect(sessCfgForTest).not.toHaveProperty(sessCertKeyPropNm);
        });

        it("should remove all creds except token when token is the top auth order", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_TOKEN}, BadAuth, ${AUTH_TYPE_BASIC}, ${AUTH_TYPE_BEARER}, ${AUTH_TYPE_CERT_PEM}`;
            sessCfgForTest.user = "userShouldNotRemain";
            sessCfgForTest.password = "passwordShouldNotRemain";
            sessCfgForTest.base64EncodedAuth = "b64AuthShouldNotRemain";
            sessCfgForTest[sessCertPropNm] = "certShouldNotRemain";
            sessCfgForTest[sessCertKeyPropNm] = "certKeyShouldNotRemain";
            delete sessCfgForTest.tokenType;
            delete sessCfgForTest.tokenValue;

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_TOKEN);
            expect(sessCfgForTest.tokenType).toEqual(cmdsArgsApimlAuthTokenTypeVal);
            expect(sessCfgForTest.tokenValue).toEqual(cmdArgsTokenValueVal);
            expect(sessCfgForTest).not.toHaveProperty("user");
            expect(sessCfgForTest).not.toHaveProperty("password");
            expect(sessCfgForTest).not.toHaveProperty("base64EncodedAuth");
            expect(sessCfgForTest).not.toHaveProperty(sessCertPropNm);
            expect(sessCfgForTest).not.toHaveProperty(sessCertKeyPropNm);
        });

        it("should remove all creds except token when bearer is the top auth order", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_BEARER}, ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_TOKEN}, ${AUTH_TYPE_BASIC}`;
            delete cmdArgsForTest.tokenType;

            sessCfgForTest.user = "userShouldNotRemain";
            sessCfgForTest.password = "passwordShouldNotRemain";
            sessCfgForTest.base64EncodedAuth = "b64AuthShouldNotRemain";
            sessCfgForTest[sessCertPropNm] = "certShouldNotRemain";
            sessCfgForTest[sessCertKeyPropNm] = "certKeyShouldNotRemain";

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_BEARER);
            expect(sessCfgForTest.tokenValue).toEqual(cmdArgsTokenValueVal);
            expect(sessCfgForTest).not.toHaveProperty("tokenType");
            expect(sessCfgForTest).not.toHaveProperty("user");
            expect(sessCfgForTest).not.toHaveProperty("password");
            expect(sessCfgForTest).not.toHaveProperty("base64EncodedAuth");
            expect(sessCfgForTest).not.toHaveProperty(sessCertPropNm);
            expect(sessCfgForTest).not.toHaveProperty(sessCertKeyPropNm);
        });

        it("should skip a top auth of bearer when a tokenType exists", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_BEARER}, ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_TOKEN}, ${AUTH_TYPE_BASIC}`;

            sessCfgForTest.user = "userShouldNotRemain";
            sessCfgForTest.password = "passwordShouldNotRemain";
            sessCfgForTest.base64EncodedAuth = "b64AuthShouldNotRemain";
            sessCfgForTest.tokenType = "tokenTypeShouldNotRemain";
            sessCfgForTest.tokenValue = "tokenValueShouldNotRemain";

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_CERT_PEM);
            expect(sessCfgForTest[sessCertPropNm]).toEqual(cmdsArgsCertFileVal);
            expect(sessCfgForTest[sessCertKeyPropNm]).toEqual(cmdsArgsCertKeyFileVal);
            expect(sessCfgForTest).not.toHaveProperty("user");
            expect(sessCfgForTest).not.toHaveProperty("password");
            expect(sessCfgForTest).not.toHaveProperty("base64EncodedAuth");
            expect(sessCfgForTest).not.toHaveProperty("tokenType");
            expect(sessCfgForTest).not.toHaveProperty("tokenValue");
        });

        it("should remove all creds except cert when cert-pem is the top auth order", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_TOKEN}, ${AUTH_TYPE_BASIC}, ${AUTH_TYPE_BEARER}`;

            sessCfgForTest.user = "userShouldNotRemain";
            sessCfgForTest.password = "passwordShouldNotRemain";
            sessCfgForTest.base64EncodedAuth = "b64AuthShouldNotRemain";
            sessCfgForTest.tokenType = "tokenTypeShouldNotRemain";
            sessCfgForTest.tokenValue = "tokenValueShouldNotRemain";
            delete sessCfgForTest[sessCertPropNm];
            delete sessCfgForTest[sessCertKeyPropNm];

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_CERT_PEM);
            expect(sessCfgForTest[sessCertPropNm]).toEqual(cmdsArgsCertFileVal);
            expect(sessCfgForTest[sessCertKeyPropNm]).toEqual(cmdsArgsCertKeyFileVal);
            expect(sessCfgForTest).not.toHaveProperty("user");
            expect(sessCfgForTest).not.toHaveProperty("password");
            expect(sessCfgForTest).not.toHaveProperty("base64EncodedAuth");
            expect(sessCfgForTest).not.toHaveProperty("tokenType");
            expect(sessCfgForTest).not.toHaveProperty("tokenValue");
        });

        it("should remove all creds when the top auth is none", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_NONE}, ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_TOKEN}, ${AUTH_TYPE_BASIC}, ${AUTH_TYPE_BEARER}`;

            sessCfgForTest.user = "userShouldNotRemain";
            sessCfgForTest.password = "passwordShouldNotRemain";
            sessCfgForTest.base64EncodedAuth = "b64AuthShouldNotRemain";
            sessCfgForTest.tokenType = "tokenTypeShouldNotRemain";
            sessCfgForTest.tokenValue = "tokenValueShouldNotRemain";
            sessCfgForTest[sessCertPropNm] = "certShouldNotRemain";
            sessCfgForTest[sessCertKeyPropNm] = "certKeyShouldNotRemain";

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_NONE);
            expect(sessCfgForTest).not.toHaveProperty("user");
            expect(sessCfgForTest).not.toHaveProperty("password");
            expect(sessCfgForTest).not.toHaveProperty("base64EncodedAuth");
            expect(sessCfgForTest).not.toHaveProperty("tokenType");
            expect(sessCfgForTest).not.toHaveProperty("tokenValue");
            expect(sessCfgForTest).not.toHaveProperty(sessCertPropNm);
            expect(sessCfgForTest).not.toHaveProperty(sessCertKeyPropNm);
        });

        it("should accept a base 64 encoded user and password as the only basic cred", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_BASIC}, ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_TOKEN}, ${AUTH_TYPE_BEARER}`;
            delete cmdArgsForTest.user;
            delete cmdArgsForTest.password;

            sessCfgForTest.tokenType = "tokenTypeShouldNotRemain";
            sessCfgForTest.tokenValue = "tokenValueShouldNotRemain";
            sessCfgForTest[sessCertPropNm] = "certShouldNotRemain";
            sessCfgForTest[sessCertKeyPropNm] = "certKeyShouldNotRemain";
            delete sessCfgForTest.user;
            delete sessCfgForTest.password;

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_BASIC);
            expect(sessCfgForTest.base64EncodedAuth).toEqual(cmdArgsB64AuthVal);
            expect(sessCfgForTest).not.toHaveProperty("user");
            expect(sessCfgForTest).not.toHaveProperty("password");
            expect(sessCfgForTest).not.toHaveProperty("tokenType");
            expect(sessCfgForTest).not.toHaveProperty("tokenValue");
            expect(sessCfgForTest).not.toHaveProperty(sessCertPropNm);
            expect(sessCfgForTest).not.toHaveProperty(sessCertKeyPropNm);
        });

        it("should reset type to token when using basic auth to request a token", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_BASIC}, ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_TOKEN}, ${AUTH_TYPE_BEARER}`;

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            AuthOrder.makingRequestForToken(sessCfgForTest);
            AuthOrder.putTopAuthInSession(sessCfgForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_TOKEN);
            expect(sessCfgForTest.user).toEqual(cmdArgUserVal);
            expect(sessCfgForTest.password).toEqual(cmdArgPassVal);
            expect(sessCfgForTest.base64EncodedAuth).toEqual(
                Buffer.from(cmdArgsForTest.user + ":" + cmdArgsForTest.password).toString("base64")
            );
            expect(sessCfgForTest.tokenType).toEqual(cmdsArgsApimlAuthTokenTypeVal);
            expect(sessCfgForTest).not.toHaveProperty("tokenValue");
            expect(sessCfgForTest).not.toHaveProperty(sessCertPropNm);
            expect(sessCfgForTest).not.toHaveProperty(sessCertKeyPropNm);
        });

        it("should keep the type as cert when using cert auth to request a token", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_BASIC}, ${AUTH_TYPE_TOKEN}, ${AUTH_TYPE_BEARER}`;

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            AuthOrder.makingRequestForToken(sessCfgForTest);
            AuthOrder.putTopAuthInSession(sessCfgForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_CERT_PEM);
            expect(sessCfgForTest[sessCertPropNm]).toEqual(cmdsArgsCertFileVal);
            expect(sessCfgForTest[sessCertKeyPropNm]).toEqual(cmdsArgsCertKeyFileVal);
            expect(sessCfgForTest.tokenType).toEqual(cmdsArgsApimlAuthTokenTypeVal);
            expect(sessCfgForTest).not.toHaveProperty("user");
            expect(sessCfgForTest).not.toHaveProperty("password");
            expect(sessCfgForTest).not.toHaveProperty("base64EncodedAuth");
            expect(sessCfgForTest).not.toHaveProperty("tokenValue");
        });

        it("should skip using top auth of token when requesting a token", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_TOKEN},  ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_BASIC}, ${AUTH_TYPE_BEARER}`;

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            AuthOrder.makingRequestForToken(sessCfgForTest);
            AuthOrder.putTopAuthInSession(sessCfgForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_CERT_PEM);
            expect(sessCfgForTest[sessCertPropNm]).toEqual(cmdsArgsCertFileVal);
            expect(sessCfgForTest[sessCertKeyPropNm]).toEqual(cmdsArgsCertKeyFileVal);
            expect(sessCfgForTest.tokenType).toEqual(cmdsArgsApimlAuthTokenTypeVal);
            expect(sessCfgForTest).not.toHaveProperty("user");
            expect(sessCfgForTest).not.toHaveProperty("password");
            expect(sessCfgForTest).not.toHaveProperty("base64EncodedAuth");
            expect(sessCfgForTest).not.toHaveProperty("tokenValue");
        });

        it("should skip using top auth of bearer when requesting a token", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_BEARER}, ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_TOKEN}, ${AUTH_TYPE_BASIC}`;

            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            AuthOrder.makingRequestForToken(sessCfgForTest);
            AuthOrder.putTopAuthInSession(sessCfgForTest);

            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_CERT_PEM);
            expect(sessCfgForTest[sessCertPropNm]).toEqual(cmdsArgsCertFileVal);
            expect(sessCfgForTest[sessCertKeyPropNm]).toEqual(cmdsArgsCertKeyFileVal);
            expect(sessCfgForTest.tokenType).toEqual(cmdsArgsApimlAuthTokenTypeVal);
            expect(sessCfgForTest).not.toHaveProperty("user");
            expect(sessCfgForTest).not.toHaveProperty("password");
            expect(sessCfgForTest).not.toHaveProperty("base64EncodedAuth");
            expect(sessCfgForTest).not.toHaveProperty("tokenValue");
        });
    }); // end addCredsToSession

    describe("putTopAuthInSession", () => {

        it("should throw an error if an invalid auth is in the authOrder cache", () => {
            const bogusAuth = "InvalidAuthType";
            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            sessCfgForTest.authTypeOrder = [(bogusAuth as any)];

            let thrownError;
            try {
                AuthOrder.putTopAuthInSession(sessCfgForTest);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain(
                `sessCfg.authTypeOrder contains an invalid authentication = ${bogusAuth}`
            );
        });

        it("should result in session type none when authTypeOrder is empty", () => {
            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_BASIC);

            // Removing authTypeOrder triggers this edge case.
            // Our logic should not allow this to happen. This test is just for code coverage.
            sessCfgForTest.authTypeOrder = [];
            AuthOrder.putTopAuthInSession(sessCfgForTest);

            // The resulting session config should have no type.
            expect(sessCfgForTest.type).toEqual(AUTH_TYPE_NONE);
        });

        it("should ensure that cacheCredsAndAuthOrder is called when availableCreds does not exist", () => {
            const cacheCredsAndAuthOrderSpy = jest.spyOn(AuthOrder as any, "cacheCredsAndAuthOrderSync");
            delete sessCfgForTest._authCache;
            expect(sessCfgForTest).not.toHaveProperty("_authCache");

            AuthOrder.putTopAuthInSession(sessCfgForTest);

            expect(cacheCredsAndAuthOrderSpy).toHaveBeenCalledTimes(1);
            expect(sessCfgForTest).toHaveProperty("_authCache");
            expect(sessCfgForTest._authCache).toHaveProperty("availableCreds");
            expect(Object.keys((sessCfgForTest as any)._authCache.availableCreds).length).toEqual(2);
        });
    }); // putTopAuthInSession

    describe("removeExtraCredsFromSess", () => {
        it("should throw an error when an invalid authTypeToRequestToken is specified using basic auth", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_TOKEN},  ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_BASIC}, ${AUTH_TYPE_BEARER}`;

            // an invalid authTypeToRequestToken with a session type of token triggers the edge case
            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            sessCfgForTest.type = AUTH_TYPE_TOKEN;
            const bogusAuthToRequestToken = "InvalidAuthToRequestToken";
            (sessCfgForTest._authCache as any).authTypeToRequestToken = bogusAuthToRequestToken;

            let thrownError;
            try {
                AuthOrder["removeExtraCredsFromSess"](sessCfgForTest);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain("The requested session contains an invalid property combination for requesting a token");
            expect(thrownError.message).toContain(`session type = ${AUTH_TYPE_TOKEN}`);
            expect(thrownError.message).toContain(`authTypeToRequestToken = ${bogusAuthToRequestToken}`);
        });

        it("should throw an error when an invalid authTypeToRequestToken is specified using cert auth", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_TOKEN},  ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_BASIC}, ${AUTH_TYPE_BEARER}`;

            // an invalid authTypeToRequestToken with a session type of token triggers the edge case
            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            sessCfgForTest.type = AUTH_TYPE_CERT_PEM;
            const bogusAuthToRequestToken = "InvalidAuthToRequestToken";
            (sessCfgForTest._authCache as any).authTypeToRequestToken = bogusAuthToRequestToken;

            let thrownError;
            try {
                AuthOrder["removeExtraCredsFromSess"](sessCfgForTest);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain("The requested session contains an invalid property combination for requesting a token");
            expect(thrownError.message).toContain(`session type = ${AUTH_TYPE_CERT_PEM}`);
            expect(thrownError.message).toContain(`authTypeToRequestToken = ${bogusAuthToRequestToken}`);
        });

        it("should throw an error when an invalid session type is specified", () => {
            cmdArgsForTest.authOrder = `${AUTH_TYPE_TOKEN},  ${AUTH_TYPE_CERT_PEM}, ${AUTH_TYPE_BASIC}, ${AUTH_TYPE_BEARER}`;

            // an invalid session type triggers the edge case
            AuthOrder.addCredsToSession(sessCfgForTest, cmdArgsForTest);
            const bogusSessType = "BadSessionType";
            (sessCfgForTest.type as any) = bogusSessType;

            let thrownError;
            try {
                AuthOrder["removeExtraCredsFromSess"](sessCfgForTest);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain(
                `The requested session contains an invalid value for 'type' = ${bogusSessType}`
            );
        });

        it("should throw an error when a null session is specified", () => {
            let thrownError;
            try {
                AuthOrder["removeExtraCredsFromSess"](null as any);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain(
                "The supplied session is null or undefined"
            );
        });
    });

    describe("putNewAuthsFirstInSess", () => {
        it("should throw an error when an invalid sessCfg parameter is specified", () => {
            let thrownError;
            try {
                AuthOrder.putNewAuthsFirstInSess(null as unknown as ISession, []);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain("The supplied sessCfg is null or undefined");
        });

        it("should replace the auth types in session with those specified", () => {
            const newFirstAuthsArray: AUTH_TYPE_CHOICES[] = [AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER];
            expect(sessCfgForTest.authTypeOrder).not.toEqual(newFirstAuthsArray);
            AuthOrder.putNewAuthsFirstInSess(sessCfgForTest, newFirstAuthsArray, {onlyTheseAuths: true});
            expect(sessCfgForTest._authCache?.didUserSetAuthOrder).toBe(true);
            expect(sessCfgForTest.authTypeOrder).toEqual(newFirstAuthsArray);
        });
    });

    describe("putNewAuthsFirstOnDisk", () => {
        const dottedPathToProfile = "Fake.Path.To.Profile.In.Config";
        const newFirstAuthsArray: AUTH_TYPE_CHOICES[] = [AUTH_TYPE_CERT_PEM, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER];
        let configObj: Config;
        let configSetSpy: any;

        beforeEach(() => {
            configObj = {
                api: {
                    profiles: {
                        exists: jest.fn().mockImplementation(() => {
                            return true;
                        }),
                        get: jest.fn(() => {
                            return {
                                exists: true,
                                basePath: "PretendThisBasePathWorks",
                                authOrder: "basic, token, bearer"
                            };
                        }),
                        getProfilePathFromName: jest.fn().mockImplementation(() => {
                            return dottedPathToProfile;
                        }),
                    },
                    layers: {
                        activate: jest.fn(),
                        find: jest.fn(() => {
                            return {
                                user: false,
                                global: false
                            };
                        }),
                        get: jest.fn(() => {
                            return {};
                        })
                    },
                },
                save: jest.fn().mockResolvedValue(Promise.resolve()),
                set: jest.fn()
            } as unknown as Config;

            configSetSpy = jest.spyOn(configObj as any, "set").mockReturnValue(undefined);
        });

        afterEach(() => {
            configSetSpy.mockClear();  // reset usage counts
        });

        it("should throw an error when an invalid profileName parameter is specified", async () => {
            let thrownError;
            try {
                await AuthOrder.putNewAuthsFirstOnDisk("", []);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain("The supplied profileName is null, undefined, or empty");
        });

        it("should throw an error when an newFirstAuths is null or undefined", async () => {
            let thrownError;
            try {
                await AuthOrder.putNewAuthsFirstOnDisk("FakeProfileName", null as unknown as AUTH_TYPE_CHOICES[]);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain("The supplied newFirstAuths is null or undefined");
        });

        it("should throw an error when an newFirstAuths not an array", async () => {
            let thrownError;
            try {
                await AuthOrder.putNewAuthsFirstOnDisk("FakeProfileName", "SomeString" as unknown as AUTH_TYPE_CHOICES[]);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain("The supplied newFirstAuths is not an array");
        });

        it("should throw an error when an newFirstAuths is an empty array", async () => {
            let thrownError;
            try {
                await AuthOrder.putNewAuthsFirstOnDisk("FakeProfileName", []);
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain("The supplied newFirstAuths is empty");
        });

        it("should throw an error when the profile does not exist", async () => {
            // make the config report that the profile does not exist
            configObj.api.profiles.exists = jest.fn().mockImplementation(() => {
                return false;
            });

            let thrownError;
            try {
                await AuthOrder.putNewAuthsFirstOnDisk("FakeProfileName", newFirstAuthsArray,
                    { onlyTheseAuths: true, clientConfig: configObj }
                );
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain("The profile = 'FakeProfileName' does not exist");
        });

        it("should throw an error when data cannot be read for the profile", async () => {
            // make the config report that it cannot get data for the profile
            configObj.api.profiles.get = jest.fn().mockImplementation(() => {
                return null;
            });

            let thrownError;
            try {
                await AuthOrder.putNewAuthsFirstOnDisk("FakeProfileName", newFirstAuthsArray,
                    { onlyTheseAuths: true, clientConfig: configObj }
                );
            } catch (err) {
                thrownError = err;
            }
            expect(thrownError).toBeInstanceOf(ImperativeError);
            expect(thrownError.message).toContain("Failed to retrieve the data for profile = 'FakeProfileName'");
        });

        it("should use only newFirstAuths when onlyTheseAuths is true", async () => {
            const authOrderCfgVal = newFirstAuthsArray.join(", ");
            await AuthOrder.putNewAuthsFirstOnDisk("FakeProfileName", newFirstAuthsArray,
                { onlyTheseAuths: true, clientConfig: configObj }
            );
            expect(configSetSpy).toHaveBeenCalledWith(
                dottedPathToProfile + ".properties.authOrder", authOrderCfgVal
            );
        });

        it("should use place newFirstAuths before existing auths when onlyTheseAuths is false", async () => {
            // token is the only auth not in our newFirstAuthsArray
            const authOrderCfgVal = newFirstAuthsArray.join(", ") + `, ${AUTH_TYPE_TOKEN}`;

            await AuthOrder.putNewAuthsFirstOnDisk("FakeProfileName", newFirstAuthsArray,
                { onlyTheseAuths: false, clientConfig: configObj }
            );
            expect(configSetSpy).toHaveBeenCalledWith(
                dottedPathToProfile + ".properties.authOrder", authOrderCfgVal
            );
        });

        describe("formNewAuthOrderArray", () => {
            it("should keep existing auths when newAuthsOpts is not specified", async () => {
                const existingAuths: AUTH_TYPE_CHOICES[] = [AUTH_TYPE_TOKEN, AUTH_TYPE_BASIC, AUTH_TYPE_BEARER];
                const newFirstAuthIsCert: AUTH_TYPE_CHOICES[] = [AUTH_TYPE_CERT_PEM];
                const expectedAuthArray: AUTH_TYPE_CHOICES[] = [...newFirstAuthIsCert, ...existingAuths];

                // using class["name"] notation because it is a private static function
                const updatedAuthArray = AuthOrder["formNewAuthOrderArray"](
                    existingAuths, newFirstAuthIsCert
                );

                expect(updatedAuthArray).toEqual(expectedAuthArray);
            });
        });

        describe("getPropNmFor", () => {
            const sessCertName = "cert";
            const cfgCertName = "certFile";
            const sessCertKeyName = "certKey";
            const cfgCertKeyName = "certKeyFile";

            it("should return the session property name when given a cert name from a session", async () => {
                const returnedPropName = AuthOrder.getPropNmFor(sessCertName, PropUse.IN_SESS);
                expect(returnedPropName).toEqual(sessCertName);
            });

            it("should return the session property name when given a cert name from a config", async () => {
                const returnedPropName = AuthOrder.getPropNmFor(cfgCertName, PropUse.IN_SESS);
                expect(returnedPropName).toEqual(sessCertName);
            });

            it("should return the config property name when given a cert name from a session", async () => {
                const returnedPropName = AuthOrder.getPropNmFor(sessCertName, PropUse.IN_CFG);
                expect(returnedPropName).toEqual(cfgCertName);
            });

            it("should return the config property name when given a cert name from a config", async () => {
                const returnedPropName = AuthOrder.getPropNmFor(cfgCertName, PropUse.IN_CFG);
                expect(returnedPropName).toEqual(cfgCertName);
            });

            it("should return the session property name when given a cert key name from a session", async () => {
                const returnedPropName = AuthOrder.getPropNmFor(sessCertKeyName, PropUse.IN_SESS);
                expect(returnedPropName).toEqual(sessCertKeyName);
            });

            it("should return the session property name when given a cert key name from a config", async () => {
                const returnedPropName = AuthOrder.getPropNmFor(cfgCertKeyName, PropUse.IN_SESS);
                expect(returnedPropName).toEqual(sessCertKeyName);
            });

            it("should return the config property name when given a cert key name from a session", async () => {
                const returnedPropName = AuthOrder.getPropNmFor(sessCertKeyName, PropUse.IN_CFG);
                expect(returnedPropName).toEqual(cfgCertKeyName);
            });

            it("should return the config property name when given a cert key name from a config", async () => {
                const returnedPropName = AuthOrder.getPropNmFor(cfgCertKeyName, PropUse.IN_CFG);
                expect(returnedPropName).toEqual(cfgCertKeyName);
            });

            it("should return the same property name when it is not a cert property", async () => {
                const nonCertName = "user";
                const returnedPropName = AuthOrder.getPropNmFor(nonCertName, PropUse.IN_SESS);
                expect(returnedPropName).toEqual(nonCertName);
            });
        });
    });
});
