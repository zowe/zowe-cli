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
import { IPingResponse, noPingInput, PingTso, StopTso, StartTso, IStartTsoParms } from "../../src";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";

let servletKey: string;

let testEnvironment: ITestEnvironment;
let systemProperties: ITestPropertiesSchema;
let REAL_SESSION: Session;

function expectZosmfResponseSucceeded(response: IPingResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
    expect(response.servletKey).toBeDefined();
    expect(response.servletKey.length).toBeGreaterThan(1);
}

function expectZosmfResponseFailed(response: IPingResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}


describe("PingTsoCommand Test", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_tso_ping"
        });
        systemProperties = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        const START_PARAMS: IStartTsoParms = {
            logonProcedure: "IZUFPROC",
            characterSet: "697",
            codePage: "1047",
            rows: "24",
            columns: "80",
            regionSize: "4096"
        };

        // start an address space for us to ping
        START_PARAMS.account = systemProperties.tso.account;
        const response = await StartTso.startCommon(REAL_SESSION, START_PARAMS);
        servletKey = response.servletKey;
    });

    afterAll(async () => {
        await StopTso.stop(REAL_SESSION, servletKey);
    });

    it("should return ping response if a correct servlet key was provided", async () => {
        let error: ImperativeError;
        let response: IPingResponse;
        try {
            response = await PingTso.ping(REAL_SESSION, servletKey);
            // Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            // Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response.success).toEqual(true);
    });
    it("should return response if an invalit servlet key was provided", async () => {
        let error: ImperativeError;
        let response: IPingResponse;
        try {
            response = await PingTso.ping(REAL_SESSION, servletKey);
            // Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            // Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseSucceeded(response, error);
        expect(response.success).toEqual(true);
    });

    it("should throw an error if no servlet key was provided", async () => {
        let error: ImperativeError;
        let response: IPingResponse;
        try {
            response = await PingTso.ping(REAL_SESSION, null);
            // Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            // Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noPingInput.message);
    });
});
