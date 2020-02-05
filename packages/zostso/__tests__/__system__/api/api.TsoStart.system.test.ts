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

/**
 * These tests runs on mainframe, with real credentials.
 * Use proper credentials in case you want to use different.
 */
import { IStartStopResponse, IStartTsoParms, IZosmfTsoResponse, noAccountNumber, noSessionTso, StartTso, StopTso } from "../../../../zostso";
import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";


let testEnvironment: ITestEnvironment;
let systemProps: ITestPropertiesSchema;
let REAL_SESSION: Session;
let ACCOUNT_NUMBER: string;

const START_PARAMS: IStartTsoParms = {
    logonProcedure: "IZUFPROC",
    characterSet: "697",
    codePage: "1047",
    rows: "24",
    columns: "80",
    regionSize: "4096"
};

const BAD_START_PARMS = {
    characterSet: "697",
    codePage: "1047",
    regionSize: "4096"
};

function expectStartResponseSucceeded(response: IStartStopResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
    expect(response.success).toEqual(true);
    expect(response.servletKey).toBeDefined();
    expect(response.servletKey.length).toBeGreaterThan(1);

    // stop successfully started address spaces
    StopTso.stop(REAL_SESSION, response.servletKey);
}

function expectStartResponseFailed(response: IStartStopResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("StartCommand (integration)", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
                        testName: "zos_tso_start"
        });
        systemProps = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ACCOUNT_NUMBER = systemProps.tso.account;
    });


    it("startCommon should succeed with correct parameters and return servlet key", async () => {
        let response: IZosmfTsoResponse;
        let error: ImperativeError;

        try {
            START_PARAMS.account = ACCOUNT_NUMBER;
            response = await StartTso.startCommon(REAL_SESSION, START_PARAMS);
            Imperative.console.info(`Response ${response.servletKey}`);
            // stop successfully started address spaces
            StopTso.stop(REAL_SESSION, response.servletKey);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(response.servletKey.length).toBeGreaterThan(1);
    });

    it("start should succeed with correct parameters", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;

        try {
            response = await StartTso.start(REAL_SESSION, ACCOUNT_NUMBER, START_PARAMS);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }

        expectStartResponseSucceeded(response, error);
    });

    it("start should succeed even if z/OSMF parameter is undefined, it will use default", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;

        try {
            response = await StartTso.start(REAL_SESSION, ACCOUNT_NUMBER, undefined);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }

        expectStartResponseSucceeded(response, error);
    });

    it("start should succeed even if required z/OSMF parameters are not fully provided, default parameters will be generated and used", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;

        try {
            response = await StartTso.start(REAL_SESSION, ACCOUNT_NUMBER, BAD_START_PARMS);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectStartResponseSucceeded(response, error);
    });

    it("should fail if account parameter is undefined", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;

        try {
            response = await StartTso.start(REAL_SESSION, undefined, START_PARAMS);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }

        expectStartResponseFailed(response, error, noAccountNumber.message);
    });

    it("should fail if account parameter is empty string", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;

        try {
            response = await StartTso.start(REAL_SESSION, "", START_PARAMS);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }

        expectStartResponseFailed(response, error, noAccountNumber.message);
    });

    it("start should fail if session parameter is undefined", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;

        try {
            response = await StartTso.start(undefined, ACCOUNT_NUMBER, START_PARAMS);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }

        expectStartResponseFailed(response, error, noSessionTso.message);
    });

});
