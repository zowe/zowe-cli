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

import { CheckStatus, ZosmfMessages } from "../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;

describe("Check Status Api", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "get_zosmf_info"
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
                response = await CheckStatus.getZosmfInfo(REAL_SESSION);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(JSON.stringify(response)).toContain("zosmf_version");
        });
    });

    describe("Failure scenarios", () => {
        it("should return with proper message for invalid session", async () => {
            let error;
            let response;

            try {
                response = await CheckStatus.getZosmfInfo(undefined);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(ZosmfMessages.missingSession.message);
        });

        (!process.env.HTTP_PROXY && !process.env.HTTPS_PROXY ? it : it.skip)("should return with proper message for invalid hostname", async () => {
            const badHostName = "badHost";
            const badSession = new Session({
                user: defaultSystem.zosmf.user,
                password: defaultSystem.zosmf.password,
                hostname: badHostName,
                port: defaultSystem.zosmf.port,
                type: "basic",
                rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
            });

            let error;
            let response;

            try {
                response = await CheckStatus.getZosmfInfo(badSession);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            const jsonCauseErrors = error.causeErrors;
            expect(jsonCauseErrors.code).toEqual("ENOTFOUND");
            expect(jsonCauseErrors.syscall).toEqual("getaddrinfo");
            expect(jsonCauseErrors.hostname).toEqual(badHostName);
        });

        (!process.env.HTTP_PROXY && !process.env.HTTPS_PROXY ? it : it.skip)("should return with proper message for invalid port", async () => {
            const badPort = 22;
            const badSession = new Session({
                user: defaultSystem.zosmf.user,
                password: defaultSystem.zosmf.password,
                hostname: defaultSystem.zosmf.host,
                port: badPort,
                type: "basic",
                rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
            });

            let error;
            let response;

            try {
                response = await CheckStatus.getZosmfInfo(badSession);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.causeErrors.message).toMatch(/EPROTO|ECONNRESET/);
            expect(error.mDetails.port).toEqual(badPort);
        }, 300000);
    });
});
