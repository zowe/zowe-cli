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

import { AbstractSession, IHandlerParameters, IProfile, Session } from "@zowe/imperative";
import { IZosFilesResponse } from "../../src/api/doc/IZosFilesResponse";
import { ZosFilesBaseHandler } from "../../src/cli/ZosFilesBase.handler";

describe("ZosFilesBaseHandler", () => {
    class TestClass extends ZosFilesBaseHandler {
        constructor(private readonly returnResponse: IZosFilesResponse) {
            super();
        }

        public async processWithSession(
            commandParameters: IHandlerParameters,
            session: AbstractSession,
            zosmfProfile: IProfile
        ): Promise<IZosFilesResponse> {
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
            base64EncodedAuth: zosmfProfile.auth,
            rejectUnauthorized: zosmfProfile.rejectUnauthorized,
        };
        const expectedSession = new Session(sessionArgs);
        const args = {...sessionArgs, host: zosmfProfile.host, password: zosmfProfile.password};

        /**
         * This object is used as a dummy command parameters object
         */
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
                    startBar: jest.fn((parms) => {
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

        const spy = jest.spyOn(testClass, "processWithSession");

        await testClass.process(commandParameters);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(commandParameters, expectedSession, zosmfProfile);

        expect(commandParameters.response.console.log).toHaveBeenCalledTimes(1);
        expect(commandParameters.response.console.log).toHaveBeenLastCalledWith(apiResponse.commandResponse);

        expect(commandParameters.response.data.setObj).toHaveBeenCalledTimes(1);
        expect(commandParameters.response.data.setObj).toHaveBeenLastCalledWith(apiResponse);
    });
});
