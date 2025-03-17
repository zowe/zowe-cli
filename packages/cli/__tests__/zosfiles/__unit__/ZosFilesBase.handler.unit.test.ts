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

import { AbstractSession, IAuthCache, IHandlerParameters, Session, SessConstants } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../../src/zosfiles/ZosFilesBase.handler";

describe("ZosFilesBaseHandler", () => {
    class TestClass extends ZosFilesBaseHandler {
        public authCache: IAuthCache;
        public authTypeOrder: SessConstants.AUTH_TYPE_CHOICES[];

        constructor(private readonly returnResponse: IZosFilesResponse) {
            super();
        }

        public async processWithSession(
            _commandParameters: IHandlerParameters,
            _session: AbstractSession
        ): Promise<IZosFilesResponse> {
            // The authCache and authTypeOrder was added to the session by the super class.
            // This is the only way that we can get them.
            this.authCache = _session.ISession._authCache;
            this.authTypeOrder = _session.ISession.authTypeOrder;
            return this.returnResponse;
        }
    }

    it("should create a session and call the subclass method", async () => {
        const zosmfProfileString = "zosmf";
        const zosmfProfile = {
            host: "secure.host.com",
            port: 443,
            user: "user",
            password: "password",
            auth: Buffer.from("user:password").toString("base64"),
            rejectUnauthorized: true
        };

        const sessionArgs: any = {
            type: "basic",
            hostname: zosmfProfile.host,
            port: zosmfProfile.port,
            user: zosmfProfile.user,
            password: zosmfProfile.password,
            rejectUnauthorized: zosmfProfile.rejectUnauthorized
        };

        /**
         * This object is used as a dummy command parameters object
         */
        const args = { ...sessionArgs, host: zosmfProfile.host, password: zosmfProfile.password };
        const commandParameters: any = {
            profiles: {
                get: (type: string) => {
                    if (type === zosmfProfileString) {
                        return zosmfProfile;
                    } else {
                        throw new Error("Invalid profile retrieved by command!");
                    }
                }
            },
            response: {
                console: {
                    log: jest.fn()
                },
                data: {
                    setObj: jest.fn()
                },
                progress: {
                    startBar: jest.fn((_parms) => {
                        // do nothing
                    }),
                    endBar: jest.fn(() => {
                        // do nothing
                    })
                }
            },
            arguments: args
        };

        const apiResponse: IZosFilesResponse = {
            success: true,
            commandResponse: "Success"
        };

        const testClass = new TestClass(apiResponse);
        const processWithSessionSpy = jest.spyOn(testClass, "processWithSession");

        await testClass.process(commandParameters);
        expect(processWithSessionSpy).toHaveBeenCalledTimes(1);

        // The session passed to "processWithSession" should contain the
        // original sessionArgs (with an authCache and authOrder added to it).
        const expectedSession = new Session(sessionArgs);
        expectedSession["mISession"]._authCache = testClass.authCache;
        expectedSession["mISession"].authTypeOrder = testClass.authTypeOrder;
        expect(processWithSessionSpy).toHaveBeenLastCalledWith(commandParameters, expectedSession);

        expect(commandParameters.response.console.log).toHaveBeenCalledTimes(1);
        expect(commandParameters.response.console.log).toHaveBeenLastCalledWith(apiResponse.commandResponse);

        expect(commandParameters.response.data.setObj).toHaveBeenCalledTimes(1);
        expect(commandParameters.response.data.setObj).toHaveBeenLastCalledWith(apiResponse);
    });
});
