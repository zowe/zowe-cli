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

import { ConnectionPropsForSessCfg } from "../../src/session/ConnectionPropsForSessCfg";
import { CliUtils } from "../../../utilities/src/CliUtils";
import { ImperativeError } from "../../../error";
import * as SessConstants from "../../src/session/SessConstants";
import { ISession } from "../../src/session/doc/ISession";
import { Logger } from "../../../logger";
import { join } from "path";

const certFilePath = join(__dirname, "..", "..", "..", "..", "__tests__", "__integration__", "cmd",
    "__tests__", "integration", "cli", "auth", "__resources__", "fakeCert.cert");
const certKeyFilePath = join(__dirname, "..", "..", "..", "..", "__tests__", "__integration__", "cmd",
    "__tests__", "integration", "cli", "auth", "__resources__", "fakeKey.key");

describe("ConnectionPropsForSessCfg tests", () => {

    it("authenticate with user and pass", async() => {
        const initialSessCfg = {
            rejectUnauthorized: true,
        };
        const args = {
            $0: "zowe",
            _: [""],
            host: "SomeHost",
            port: 11,
            user: "FakeUser",
            password: "FakePassword"
        };
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args
        );
        expect(sessCfgWithConnProps.hostname).toBe("SomeHost");
        expect(sessCfgWithConnProps.port).toBe(11);
        expect(sessCfgWithConnProps.user).toBe("FakeUser");
        expect(sessCfgWithConnProps.password).toBe("FakePassword");
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BASIC);
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("authenticate with user, pass, and tokenType to get token", async() => {
        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            user: "FakeUser",
            password: "FakePassword",
            tokenType: SessConstants.TOKEN_TYPE_JWT
        };
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args, {requestToken: true}
        );
        expect(sessCfgWithConnProps.hostname).toBe("SomeHost");
        expect(sessCfgWithConnProps.user).toBe("FakeUser");
        expect(sessCfgWithConnProps.password).toBe("FakePassword");
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_TOKEN);
        expect(sessCfgWithConnProps.tokenType).toBe(SessConstants.TOKEN_TYPE_JWT);
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("authenticate with user, pass, and *NO* tokenType to get token", async() => {
        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            user: "FakeUser",
            password: "FakePassword"
        };
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args, {requestToken: true}
        );
        expect(sessCfgWithConnProps.hostname).toBe("SomeHost");
        expect(sessCfgWithConnProps.user).toBe("FakeUser");
        expect(sessCfgWithConnProps.password).toBe("FakePassword");
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_TOKEN);
        expect(sessCfgWithConnProps.tokenType).toBe(SessConstants.TOKEN_TYPE_JWT);
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("authenticate with token value", async() => {
        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true,
        };
        const args = {
            $0: "zowe",
            _: [""],
            tokenValue: "FakeToken",
        };
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args
        );
        expect(sessCfgWithConnProps.hostname).toBe("SomeHost");
        expect(sessCfgWithConnProps.tokenValue).toBe("FakeToken");
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BEARER);
        expect(sessCfgWithConnProps.user).toBeUndefined();
        expect(sessCfgWithConnProps.password).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("authenticate with token value and token type", async() => {
        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            tokenValue: "FakeToken",
            tokenType: SessConstants.TOKEN_TYPE_LTPA
        };
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args
        );
        expect(sessCfgWithConnProps.hostname).toBe("SomeHost");
        expect(sessCfgWithConnProps.tokenValue).toBe("FakeToken");
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_TOKEN);
        expect(sessCfgWithConnProps.tokenType).toBe(SessConstants.TOKEN_TYPE_LTPA);
        expect(sessCfgWithConnProps.user).toBeUndefined();
        expect(sessCfgWithConnProps.password).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("authenticate with certFile and certKeyFile", async() => {
        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            certFile: certFilePath,
            certKeyFile: certKeyFilePath
        };
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args
        );
        expect(sessCfgWithConnProps.hostname).toBe("SomeHost");
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_CERT_PEM);
        expect(sessCfgWithConnProps.cert).toBe(certFilePath);
        expect(sessCfgWithConnProps.certKey).toBe(certKeyFilePath);
        expect(sessCfgWithConnProps.user).toBeUndefined();
        expect(sessCfgWithConnProps.password).toBeUndefined();
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
    });

    it("not set tokenValue if user and pass are defined", async() => {
        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            user: "FakeUser",
            password: "FakePassword",
            tokenType: SessConstants.TOKEN_TYPE_JWT,
            tokenValue: "FakeToken"
        };
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args
        );
        expect(sessCfgWithConnProps.hostname).toBe("SomeHost");
        expect(sessCfgWithConnProps.user).toBe("FakeUser");
        expect(sessCfgWithConnProps.password).toBe("FakePassword");
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BASIC);
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("not prompt when asked not to prompt", async() => {
        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""]
        };

        const sessCfgWithConnProps: ISession = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args, {doPrompting: false}
        );
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BASIC);
        expect(sessCfgWithConnProps.user).toBeUndefined();
        expect(sessCfgWithConnProps.password).toBeUndefined();
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("get user name from prompt", async() => {
        const userFromPrompt = "FakeUser";
        const passFromArgs = "FakePassword";

        const sleepReal = CliUtils.sleep;
        CliUtils.sleep = jest.fn();
        const promptWithTimeoutReal = CliUtils.promptWithTimeout;
        CliUtils.promptWithTimeout = jest.fn(() => {
            return Promise.resolve(userFromPrompt);
        });

        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            password: passFromArgs
        };

        const sessCfgWithConnProps: ISession = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args
        );
        CliUtils.sleep = sleepReal;
        CliUtils.promptWithTimeout = promptWithTimeoutReal;

        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BASIC);
        expect(sessCfgWithConnProps.user).toBe(userFromPrompt);
        expect(sessCfgWithConnProps.password).toBe(passFromArgs);
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("get password from prompt", async() => {
        const userFromArgs = "FakeUser";
        const passFromPrompt = "FakePassword";

        const sleepReal = CliUtils.sleep;
        CliUtils.sleep = jest.fn();
        const promptWithTimeoutReal = CliUtils.promptWithTimeout;
        CliUtils.promptWithTimeout = jest.fn(() => {
            return Promise.resolve(passFromPrompt);
        });

        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            user: userFromArgs
        };

        const sessCfgWithConnProps: ISession = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args
        );
        CliUtils.sleep = sleepReal;
        CliUtils.promptWithTimeout = promptWithTimeoutReal;

        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BASIC);
        expect(sessCfgWithConnProps.user).toBe(userFromArgs);
        expect(sessCfgWithConnProps.password).toBe(passFromPrompt);
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("get host name from prompt", async() => {
        const hostFromPrompt = "FakeHost";
        const portFromArgs = 11;
        const userFromArgs = "FakeUser";
        const passFromArgs = "FakePassword";

        const sleepReal = CliUtils.sleep;
        CliUtils.sleep = jest.fn();
        const promptWithTimeoutReal = CliUtils.promptWithTimeout;
        CliUtils.promptWithTimeout = jest.fn(() => {
            return Promise.resolve(hostFromPrompt);
        });

        const initialSessCfg = {
            rejectUnauthorized: true,
        };
        const args = {
            $0: "zowe",
            _: [""],
            port: portFromArgs,
            user: userFromArgs,
            password: passFromArgs
        };

        const sessCfgWithConnProps: ISession = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args
        );
        CliUtils.sleep = sleepReal;
        CliUtils.promptWithTimeout = promptWithTimeoutReal;

        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BASIC);
        expect(sessCfgWithConnProps.user).toBe(userFromArgs);
        expect(sessCfgWithConnProps.password).toBe(passFromArgs);
        expect(sessCfgWithConnProps.hostname).toBe(hostFromPrompt);
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("get port from prompt", async() => {
        const hostFromArgs = "FakeHost";
        const portFromPrompt = 11;
        const userFromArgs = "FakeUser";
        const passFromArgs = "FakePassword";

        const sleepReal = CliUtils.sleep;
        CliUtils.sleep = jest.fn();
        const promptWithTimeoutReal = CliUtils.promptWithTimeout;
        CliUtils.promptWithTimeout = jest.fn(() => {
            return Promise.resolve(portFromPrompt);
        });

        const initialSessCfg = {
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            host: hostFromArgs,
            user: userFromArgs,
            password: passFromArgs
        };

        const sessCfgWithConnProps: ISession = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args
        );
        CliUtils.sleep = sleepReal;
        CliUtils.promptWithTimeout = promptWithTimeoutReal;

        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BASIC);
        expect(sessCfgWithConnProps.user).toBe(userFromArgs);
        expect(sessCfgWithConnProps.password).toBe(passFromArgs);
        expect(sessCfgWithConnProps.hostname).toBe(hostFromArgs);
        expect(sessCfgWithConnProps.port).toBe(portFromPrompt);
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("throws an error if user doesn't enter port as a number", async() => {
        const hostFromArgs = "FakeHost";
        const portFromPrompt = "abcd";
        const userFromArgs = "FakeUser";
        const passFromArgs = "FakePassword";

        const sleepReal = CliUtils.sleep;
        CliUtils.sleep = jest.fn();
        const promptWithTimeoutReal = CliUtils.promptWithTimeout;
        CliUtils.promptWithTimeout = jest.fn(() => {
            return Promise.resolve(portFromPrompt);
        });

        const initialSessCfg = {
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            host: hostFromArgs,
            user: userFromArgs,
            password: passFromArgs
        };

        let theError;
        try {
            await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(initialSessCfg, args);
        } catch (err) {
            theError = err;
        }
        CliUtils.sleep = sleepReal;
        CliUtils.promptWithTimeout = promptWithTimeoutReal;

        expect(theError.message).toBe("Specified port was not a number.");
    });

    it("timeout waiting for user name", async() => {
        const sleepReal = CliUtils.sleep;
        CliUtils.sleep = jest.fn();
        const promptWithTimeoutReal = CliUtils.promptWithTimeout;
        CliUtils.promptWithTimeout = jest.fn(() => null);

        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            password: "FakePassword"
        };

        let sessCfgWithConnProps: ISession;
        let caughtError;
        try {
            sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
                initialSessCfg, args
            );
        } catch (thrownError) {
            caughtError = thrownError;
        }
        CliUtils.sleep = sleepReal;
        CliUtils.promptWithTimeout = promptWithTimeoutReal;
        expect(caughtError instanceof ImperativeError).toBe(true);
        expect(caughtError.message).toBe("Timed out waiting for user name.");
    });

    it("timeout waiting for password", async() => {
        const sleepReal = CliUtils.sleep;
        CliUtils.sleep = jest.fn();
        const promptWithTimeoutReal = CliUtils.promptWithTimeout;
        CliUtils.promptWithTimeout = jest.fn(() => null);

        const initialSessCfg = {
            hostname: "SomeHost",
            port: 11,
            rejectUnauthorized: true
        };
        const args = {
            $0: "zowe",
            _: [""],
            user: "FakeUser"
        };

        let sessCfgWithConnProps: ISession;
        let caughtError;
        try {
            sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
                initialSessCfg, args
            );
        } catch (thrownError) {
            caughtError = thrownError;
        }
        CliUtils.sleep = sleepReal;
        CliUtils.promptWithTimeout = promptWithTimeoutReal;
        expect(caughtError instanceof ImperativeError).toBe(true);
        expect(caughtError.message).toBe("Timed out waiting for password.");
    });

    it("timeout waiting for host name", async() => {
        const sleepReal = CliUtils.sleep;
        CliUtils.sleep = jest.fn();
        const promptWithTimeoutReal = CliUtils.promptWithTimeout;
        CliUtils.promptWithTimeout = jest.fn(() => null);

        const initialSessCfg = {
            rejectUnauthorized: true,
        };
        const args = {
            $0: "zowe",
            _: [""],
            port: 11,
            user: "FakeUser",
            password: "FakePassword"
        };

        let sessCfgWithConnProps: ISession;
        let caughtError;
        try {
            sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
                initialSessCfg, args
            );
        } catch (thrownError) {
            caughtError = thrownError;
        }
        CliUtils.sleep = sleepReal;
        CliUtils.promptWithTimeout = promptWithTimeoutReal;
        expect(caughtError instanceof ImperativeError).toBe(true);
        expect(caughtError.message).toBe("Timed out waiting for host name.");
    });

    it("timeout waiting for port number", async() => {
        const sleepReal = CliUtils.sleep;
        CliUtils.sleep = jest.fn();
        const promptWithTimeoutReal = CliUtils.promptWithTimeout;
        CliUtils.promptWithTimeout = jest.fn(() => null);

        const initialSessCfg = {
            rejectUnauthorized: true,
        };
        const args = {
            $0: "zowe",
            _: [""],
            host: "SomeHost",
            user: "FakeUser",
            password: "FakePassword"
        };

        let sessCfgWithConnProps: ISession;
        let caughtError;
        try {
            sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
                initialSessCfg, args
            );
        } catch (thrownError) {
            caughtError = thrownError;
        }
        CliUtils.sleep = sleepReal;
        CliUtils.promptWithTimeout = promptWithTimeoutReal;
        expect(caughtError instanceof ImperativeError).toBe(true);
        expect(caughtError.message).toBe("Timed out waiting for port number.");
    });

    it("should not log secure properties of session config", async () => {
        const mockLoggerDebug = jest.fn();
        const getImperativeLoggerSpy = jest.spyOn(Logger, "getImperativeLogger")
            .mockReturnValueOnce({ debug: mockLoggerDebug } as any);
        (ConnectionPropsForSessCfg as any).logSessCfg({
            host: "SomeHost",
            port: 11,
            user: "FakeUser",
            password: "FakePassword",
            tokenType: SessConstants.TOKEN_TYPE_JWT,
            tokenValue: "FakeToken"
        });
        getImperativeLoggerSpy.mockRestore();
        expect(mockLoggerDebug).toHaveBeenCalledTimes(1);
        const logOutput = mockLoggerDebug.mock.calls[0][0];
        expect(logOutput).toContain("SomeHost");
        expect(logOutput).not.toContain("FakeUser");
        expect(logOutput).not.toContain("FakePassword");
        expect(logOutput).not.toContain("FakeToken");
    });

    it("SSO CallBack with getValuesBack", async() => {
        const initialSessCfg = {
            rejectUnauthorized: true,
        };
        const fakeFunctionSessCfg = {
            hostname: "SomeHost",
            port: 11,
            user: "FakeUser",
            password: "FakePassword",
            rejectUnauthorized: false
        };
        const args = {
            $0: "zowe",
            _: [""]
        };
        const fakeFunction = jest.fn((neededProps) => {
            for (const value of neededProps) {
                switch (value) {
                    case "hostname" :
                        neededProps[value] = fakeFunctionSessCfg.hostname;
                        break;
                    case "port" :
                        neededProps[value] = fakeFunctionSessCfg.port;
                        break;
                    case "user" :
                        neededProps[value] = fakeFunctionSessCfg.user;
                        break;
                    case "password" :
                        neededProps[value] = fakeFunctionSessCfg.password;
                        break;
                    case "rejectUnauthorized" :
                        neededProps[value] = initialSessCfg.rejectUnauthorized;
                        break;
                    default:
                        return;
                }
            }
            return neededProps;
        });
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args, {getValuesBack: fakeFunction}
        );
        expect(sessCfgWithConnProps.hostname).toBe("SomeHost");
        expect(sessCfgWithConnProps.port).toBe(11);
        expect(sessCfgWithConnProps.user).toBe("FakeUser");
        expect(sessCfgWithConnProps.password).toBe("FakePassword");
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BASIC);
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });

    it("SSO CallBack with getValuesBack and partial session config", async() => {
        const initialSessCfg = {
            password: "FakePassword",
            rejectUnauthorized: true,
        };
        const fakeFunctionSessCfg = {
            hostname: "SomeHost",
            port: 11,
        };
        const args = {
            $0: "zowe",
            _: [""],
            user: "FakeUser",
        };
        const fakeFunction = jest.fn((neededProps) => {
            for (const value of neededProps) {
                switch (value) {
                    case "hostname" :
                        neededProps[value] = fakeFunctionSessCfg.hostname;
                        break;
                    case "port" :
                        neededProps[value] = fakeFunctionSessCfg.port;
                        break;
                    case "user" :
                        neededProps[value] = args.user;
                        break;
                    case "password" :
                        neededProps[value] = initialSessCfg.password;
                        break;
                    case "rejectUnauthorized" :
                        neededProps[value] = initialSessCfg.rejectUnauthorized;
                        break;
                    default:
                        return;
                }
            }
            return neededProps;
        });
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            initialSessCfg, args, {getValuesBack: fakeFunction}
        );
        expect(sessCfgWithConnProps.hostname).toBe("SomeHost");
        expect(sessCfgWithConnProps.port).toBe(11);
        expect(sessCfgWithConnProps.user).toBe("FakeUser");
        expect(sessCfgWithConnProps.password).toBe("FakePassword");
        expect(sessCfgWithConnProps.type).toBe(SessConstants.AUTH_TYPE_BASIC);
        expect(sessCfgWithConnProps.tokenValue).toBeUndefined();
        expect(sessCfgWithConnProps.tokenType).toBeUndefined();
        expect(sessCfgWithConnProps.cert).toBeUndefined();
        expect(sessCfgWithConnProps.certKey).toBeUndefined();
    });
});
