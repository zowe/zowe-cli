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

import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { AuthOrder, Session, ImperativeError, Imperative } from "@zowe/imperative";
import { Login } from "../../../src/auth/Login";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let REAL_SESSION: Session;

describe("Login system test", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "auth_login"
        });
        REAL_SESSION = TestEnvironment.createBaseSession(testEnvironment);

        // TestEnvironment has no means to make a request for a token, so
        // we update the session with a request for a token
        AuthOrder.makingRequestForToken(REAL_SESSION.ISession);
        AuthOrder.addCredsToSession(REAL_SESSION.ISession, { "$0": "NameNotUsed", "_": [] });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should succeed with correct parameters and retrieve a token from the APIML", async () => {
        let response: any;
        let error: ImperativeError;
        try {
            response = await Login.apimlLogin(REAL_SESSION);
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
