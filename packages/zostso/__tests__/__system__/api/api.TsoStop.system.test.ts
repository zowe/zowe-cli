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

import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import {
    IStartStopResponse,
    IStopTsoParms,
    IZosmfTsoResponse,
    noServletKeyInput,
    noSessionTso,
    noTsoStopInput,
    StartTso,
    StopTso
} from "../../../../zostso";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { inspect } from "util";

/**
 * These tests runs on mainframe, with real credentials.
 * Use proper credentials in case you want to use different.
 */

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let REAL_SESSION: Session;
let ACCOUNT_NUMBER: string;
const STOP_PARMS: IStopTsoParms = { servletKey: undefined };
const ZOSMF_ERROR_MESSAGE: string = 'IZUG1126E: z/OSMF cannot correlate the request for key "ZOSMFAD-SYS2-55-aaakaaac"' +
    " with an active z/OS application session.";

const LONG_TIMEOUT = 10000;

describe("StopCommand (integration)", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
                        testName: "zos_tso_stop"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ACCOUNT_NUMBER = defaultSystem.tso.account;
    });


    it("stopCommon should succeed with correct parameters", async () => {
        let response: IZosmfTsoResponse;
        let error: ImperativeError;
        const activeServletKey: string = (await StartTso.start(REAL_SESSION, ACCOUNT_NUMBER, undefined)).servletKey;
        STOP_PARMS.servletKey = activeServletKey;
        Imperative.console.info(`Active servlet key ${activeServletKey}`);
        try {
            response = await StopTso.stopCommon(REAL_SESSION, STOP_PARMS);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error.details.msg}`);
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(response.servletKey).toEqual(activeServletKey);
        expect(response.servletKey.length).toBeGreaterThan(1);
    }, LONG_TIMEOUT);

    it("stopCommon should throw an error if session parameter is undefined", async () => {
        let response: IZosmfTsoResponse;
        let error: ImperativeError;
        const activeServletKey: string = (await StartTso.start(REAL_SESSION, ACCOUNT_NUMBER, undefined)).servletKey;
        STOP_PARMS.servletKey = activeServletKey;
        Imperative.console.info(`Active servlet key ${activeServletKey}`);
        try {
            response = await StopTso.stopCommon(undefined, STOP_PARMS);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error.details.msg}`);
        }
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(noSessionTso.message);
    }, LONG_TIMEOUT);

    it("stopCommon should throw an error if stop command parameters are undefined", async () => {
        let response: IZosmfTsoResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stopCommon(REAL_SESSION, undefined);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error.details.msg}`);
        }
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(noTsoStopInput.message);
    }, LONG_TIMEOUT);

    it("stopCommon should throw an error if servlet key is undefined", async () => {
        let response: IZosmfTsoResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stopCommon(REAL_SESSION, { servletKey: undefined });
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error.details.msg}`);
        }
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(noServletKeyInput.message);
    }, LONG_TIMEOUT);

    it("stop should succeed with correct parameters", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;
        const activeServletKey: string = (await StartTso.start(REAL_SESSION, ACCOUNT_NUMBER, undefined)).servletKey;
        Imperative.console.info(`Active servlet key ${activeServletKey}`);
        try {
            response = await StopTso.stop(REAL_SESSION, activeServletKey);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error.details.msg}`);
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(response.success).toEqual(true);
        expect(response.servletKey).toEqual(activeServletKey);
        expect(response.servletKey.length).toBeGreaterThan(1);
    }, LONG_TIMEOUT);

    it("stop should throw an error if session parameter is undefined", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;
        const activeServletKey: string = (await StartTso.start(REAL_SESSION, ACCOUNT_NUMBER, undefined)).servletKey;
        Imperative.console.info(`Active servlet key ${activeServletKey}`);
        try {
            response = await StopTso.stop(undefined, activeServletKey);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error.details.msg}`);
        }
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(noSessionTso.message);
    }, LONG_TIMEOUT);

    it("stop should throw an error if servlet key is undefined", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stop(REAL_SESSION, undefined);
            Imperative.console.info(`Response ${response.servletKey}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error.details.msg}`);
        }
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(noServletKeyInput.message);
    }, LONG_TIMEOUT);

    it("should throw an error if servlet key is inactive", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stop(REAL_SESSION, "ZOSMFAD-SYS2-55-aaakaaac");
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(ZOSMF_ERROR_MESSAGE);
    }, LONG_TIMEOUT);
});
