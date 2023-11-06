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

import { ImperativeError, Session } from "@zowe/core-for-zowe-sdk";
import { ISendResponse, IStartStopResponse, SendTso, StartTso, StopTso } from "../../src";
import * as fs from "fs";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let systemProperties: ITestPropertiesSchema;
let REAL_SESSION: Session;
let ACCOUNT_NUMBER: string;

const LONG_TIMEOUT: number = 10000;

describe("TsoSend sendDataToTSO", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_tso_send"
        });
        systemProperties = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ACCOUNT_NUMBER = systemProperties.tso.account;
    });

    it("should start address space and display time", async () => {
        let error: ImperativeError;
        let response: ISendResponse;
        const key: IStartStopResponse = await StartTso.start(REAL_SESSION, ACCOUNT_NUMBER, undefined);
        try {
            response = await SendTso.sendDataToTSOCollect(REAL_SESSION, key.servletKey, "time");
            await StopTso.stop(REAL_SESSION, key.servletKey);

        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        const regex = fs.readFileSync(__dirname + "/__regex__/d_time.regex").toString();
        expect(new RegExp(regex, "g").test(response.commandResponse.toString())).toBe(true);
    }, LONG_TIMEOUT);

    it("should fail fot bad address space", async () => {
        let error: ImperativeError;
        let response: ISendResponse;
        try {
            response = await SendTso.sendDataToTSOCollect(REAL_SESSION, "badKey", "time");

        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).toBeUndefined();
        expect(error).toBeDefined();
    });
});
