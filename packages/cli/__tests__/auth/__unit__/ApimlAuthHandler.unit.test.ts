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

import ApimlAuthHandler from "../../../src/auth/ApimlAuthHandler";
import { SessConstants } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { Login, Logout } from "@zowe/core-for-zowe-sdk";

describe("ApimlAuthHandler", () => {
    it("should not have changed", () => {
        const mockCreateZosmfSession = jest.fn();
        const mockApimlLogin = jest.fn();
        const mockApimlLogout = jest.fn();

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Login.apimlLogin = mockApimlLogin;
        Logout.apimlLogout = mockApimlLogout;

        const handler: any = new ApimlAuthHandler();
        expect(handler.mProfileType).toBe("base");
        expect(handler.mDefaultTokenType).toBe(SessConstants.TOKEN_TYPE_APIML);

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        handler.doLogin();
        expect(mockApimlLogin).toHaveBeenCalledTimes(1);

        handler.doLogout();
        expect(mockApimlLogout).toHaveBeenCalledTimes(1);
    });
});
