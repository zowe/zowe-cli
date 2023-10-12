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

import { BaseAuthHandler } from "../handlers/BaseAuthHandler";
import { ICommandArguments, IHandlerParameters } from "../../../../cmd";
import { Session, ISession, AbstractSession, SessConstants } from "../../../../rest";
import { Imperative } from "../../Imperative";
import { cloneDeep } from "lodash";

class FakeAuthHandler extends BaseAuthHandler {
    public mProfileType: string = "base";

    public mDefaultTokenType: SessConstants.TOKEN_TYPE_CHOICES = SessConstants.TOKEN_TYPE_JWT;

    protected createSessCfgFromArgs(args: ICommandArguments): ISession {
        return { hostname: "fakeHost", port: 3000 };
    }

    protected async doLogin(session: AbstractSession): Promise<string> {
        return "fakeToken";
    }

    protected async doLogout(session: AbstractSession): Promise<void> { /* Do nothing */ }
}

describe("BaseAuthHandler", () => {
    beforeAll(() => {
        Object.defineProperty(Imperative, "api", {
            get: () => ({
                profileManager: (profType: string) => ({
                    save: jest.fn(),
                    update: jest.fn()
                })
            })
        });
    });

    it("should process login successfully - basic auth", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {
                user: "fakeUser",
                password: "fakePass"
            },
            positionals: ["auth", "login"],
            profiles: {
                getMeta: jest.fn(() => ({
                    name: "fakeName"
                }))
            }
        } as any;

        const doLoginSpy = jest.spyOn(handler as any, "doLogin");
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLoginSpy).toBeCalledTimes(1);
    });

    it("should process login successfully - certificate auth", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {
                certFile: "/fake/file/path.cert",
                certKeyFile: "/fake/file/path.key"
            },
            positionals: ["auth", "login"],
            profiles: {
                getMeta: jest.fn(() => ({
                    name: "fakeName"
                }))
            }
        } as any;

        const doLoginSpy = jest.spyOn(handler as any, "doLogin");
        let sessionCopy;

        doLoginSpy.mockImplementation((sessCfg: Session) => {
            sessionCopy = cloneDeep(sessCfg);
            return "fakeToken";
        });
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLoginSpy).toBeCalledTimes(1);
        expect(doLoginSpy).toBeCalledWith(expect.objectContaining({
            mISession: {
                basePath: "",
                cert: "/fake/file/path.cert",
                certKey: "/fake/file/path.key",
                hostname: "fakeHost",
                port: 3000,
                protocol: "https",
                rejectUnauthorized: true,
                secureProtocol: "SSLv23_method",
                storeCookie: false,
                strictSSL: true,
                tokenType: "jwtToken",
                type: "cert-pem"
            }
        }));
        expect(sessionCopy).toEqual(expect.objectContaining({
            mISession: {
                basePath: "",
                cert: "/fake/file/path.cert",
                certKey: "/fake/file/path.key",
                hostname: "fakeHost",
                port: 3000,
                protocol: "https",
                rejectUnauthorized: true,
                secureProtocol: "SSLv23_method",
                storeCookie: true,
                strictSSL: true,
                tokenType: "jwtToken",
                type: "cert-pem"
            }
        }));
    });

    it("should process logout successfully", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {
                host: "fakeHost",
                port: "fakePort",
                tokenType: handler.mDefaultTokenType,
                tokenValue: "fakeToken"
            },
            positionals: ["auth", "logout"],
            profiles: {
                getMeta: jest.fn(() => ({
                    name: "fakeName"
                }))
            }
        } as any;

        const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLogoutSpy).toBeCalledTimes(1);
    });

    it("should fail to process invalid action name", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {},
            positionals: ["auth", "invalid"],
            profiles: {
                getMeta: jest.fn(() => ({
                    name: "fakeName"
                }))
            }
        } as any;

        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain(`The group name "invalid"`);
        expect(caughtError.message).toContain("is not valid");
    });
});
