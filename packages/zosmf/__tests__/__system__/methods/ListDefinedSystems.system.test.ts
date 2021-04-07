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

import { ListDefinedSystems, ZosmfMessages } from "../../../../zosmf";
import { Session, Imperative } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../__tests__/__packages__/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;

describe("List Defined Systems Api", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "list_zosmf_def"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        it("should return with expected information", async () => {
            let error;
            let response;

            try {
                response = await ListDefinedSystems.listDefinedSystems(REAL_SESSION);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(JSON.stringify(response)).toContain("items");
        });
    });

    describe("Failure scenarios", () => {
        it("should return with proper message for invalid session", async () => {
            let error;
            let response;

            try {
                response = await ListDefinedSystems.listDefinedSystems(undefined);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(ZosmfMessages.missingSession.message);
        });

        it("should return with proper message for invalid hostname", async () => {
            const badHostName = "badHost";
            const badSession = new Session({
                user: defaultSystem.zosmf.user,
                password: defaultSystem.zosmf.pass,
                hostname: badHostName,
                port: defaultSystem.zosmf.port,
                type: "basic",
                rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
            });

            let error;
            let response;

            try {
                response = await ListDefinedSystems.listDefinedSystems(badSession);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(`Error: getaddrinfo ENOTFOUND ${badHostName}`);
        });

        it("should return with proper message for invalid port", async () => {
            const badPort = 9999;
            const badSession = new Session({
                user: defaultSystem.zosmf.user,
                password: defaultSystem.zosmf.pass,
                hostname: defaultSystem.zosmf.host,
                port: badPort,
                type: "basic",
                rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
            });

            let error;
            let response;

            try {
                response = await ListDefinedSystems.listDefinedSystems(badSession);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(`Error: connect ECONNREFUSED`);
            expect(error.message).toContain(badPort);
        });
    });
});
