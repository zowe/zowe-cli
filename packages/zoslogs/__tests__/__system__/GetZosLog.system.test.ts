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

import { ImperativeError, Session } from "@zowe/imperative";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { GetZosLog, IZosLogType, noSessionMessage, IZosLogParms } from "../../src";
import { ZosLogTestUtils } from "../__resources__/utils/ZosLogTestUtils";

let testEnvironment: ITestEnvironment;

let REAL_SESSION: Session;
const COMMAND_PARAMS_FULL: IZosLogParms = { startTime: "2021-08-11T07:02:52.022Z", direction: "forward", range: "1m" };

describe("GetZosLog (system)", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zoslog_GetZosLog",
            tempProfileTypes: ["zosmf"]
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it(
        "getZosLog should succeed and return logs with all params",
        async () => {
            let response: IZosLogType;
            let error: ImperativeError;
            try {
                response = await GetZosLog.getZosLog(REAL_SESSION, COMMAND_PARAMS_FULL);
                // Imperative.console.info(`Response ${response}`);
                // Imperative.console.info(`Response.totalitems ${response.totalitems}`);
            } catch (thrownError) {
                error = thrownError;
                // Imperative.console.info(`Error ${error}`);
            }
            ZosLogTestUtils.expectZosmfResponseSucceeded(response, error);
            expect(response.totalitems).toBeDefined();
        },
        ZosLogTestUtils.MAX_TIMEOUT_TIME
    );

    it(
        "getZosLog should succeed and return logs with no params",
        async () => {
            let response: IZosLogType;
            let error: ImperativeError;
            try {
                response = await GetZosLog.getZosLog(REAL_SESSION, {});
                // Imperative.console.info(`Response ${response}`);
                // Imperative.console.info(`Response.totalitems ${response.totalitems}`);
            } catch (thrownError) {
                error = thrownError;
                // Imperative.console.info(`Error ${error}`);
            }
            ZosLogTestUtils.expectZosmfResponseSucceeded(response, error);
            expect(response.totalitems).toBeDefined();
        },
        ZosLogTestUtils.MAX_TIMEOUT_TIME
    );

    it("getZosLog should fail and throw an error if the session parameter is undefined", async () => {
        let response: IZosLogType;
        let error: ImperativeError;
        try {
            response = await GetZosLog.getZosLog(undefined, COMMAND_PARAMS_FULL);
            // Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            // Imperative.console.info(`Error ${error}`);
        }
        ZosLogTestUtils.expectZosmfResponseFailed(response, error, noSessionMessage.message);
    });
});
