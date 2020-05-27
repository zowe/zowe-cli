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

import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { Session, ImperativeError, Imperative, ImperativeExpect } from "@zowe/imperative";
import { LoginConstants } from "../../../src/api/LoginConstants";
import { Login } from "../../../src/api/Login";

let testEnvironment: ITestEnvironment;
let REAL_SESSION: Session;

describe("Login system test", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "auth_login"
        });
        REAL_SESSION = TestEnvironment.createBaseSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should succeed with correct parameters and retrieve a token from the APIML", async () => {
        let response: any;
        let error: ImperativeError;
        try {
            response = await Login.apimlLogin(REAL_SESSION, "POST", LoginConstants.APIML_V1_RESOURCE);
            REAL_SESSION.ISession.tokenValue = response;
            Imperative.console.info(`Got token: ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(response).not.toEqual("");
    });
});
