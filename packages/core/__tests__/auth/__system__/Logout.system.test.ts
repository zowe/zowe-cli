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
import { Session, ImperativeError, Imperative } from "@zowe/imperative";
import { Login } from "../../../src/auth/Login";
import { Logout } from "../../../src/auth/Logout";
import { ZosmfRestClient } from "../../../src/rest/ZosmfRestClient";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let REAL_SESSION: Session;
let token: string;

describe("Logout system test", () => {
    beforeAll(async () => {
        let error;

        testEnvironment = await TestEnvironment.setUp({
            testName: "auth_logout"
        });

        REAL_SESSION = TestEnvironment.createBaseSession(testEnvironment);

        try {
            token = await Login.apimlLogin(REAL_SESSION);
            if (token === null || token === undefined) {
                throw new ImperativeError({msg: "Unable to retrieve token for test."});
            }
            REAL_SESSION.ISession.tokenValue = token;
            Imperative.console.info(`Got token: ${token}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
            throw thrownError;
        }
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should succeed with correct parameters and invalidate token using APIML", async () => {
        let error: ImperativeError;
        const client = new ZosmfRestClient(REAL_SESSION);

        try {
            client.session.ISession.type = "token";
            client.session.ISession.tokenType = "apimlAuthenticationToken";
            client.session.ISession.tokenValue = token;

            await client.request({request: "GET", resource: "/api/v1/gateway/auth/query"});
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }

        expect(client.response.statusCode).toEqual(200);
        expect(error).not.toBeDefined();

        try {
            await Logout.apimlLogout(REAL_SESSION);

            client.session.ISession.type = "token";
            client.session.ISession.tokenType = "apimlAuthenticationToken";
            client.session.ISession.tokenValue = token;

            await client.request({request: "GET", resource: "/api/v1/gateway/auth/query"});
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }

        expect(client.response.statusCode).toEqual(401);
        expect(error).toBeDefined();
    });
});
