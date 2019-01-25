/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { inspect } from "util";
import { ZosmfHeaders, ZosmfRestClient } from "../../../rest";
import { Headers, Imperative, ImperativeError, Session } from "@brightside/imperative";
import {
    IStartStopResponse,
    IStopTsoParms,
    IZosmfPingResponse,
    IZosmfTsoResponse,
    noServletKeyInput,
    noSessionTso,
    StopTso,
    TsoConstants
} from "../../../zostso";


const SERVLET_KEY: string = "ZOSMFAD-SYS2-55-aaakaaac";

const STOP_PARMS: IStopTsoParms = {servletKey: SERVLET_KEY};

const STOP_HEADERS: any[] = [ZosmfHeaders.X_CSRF_ZOSMF_HEADER, Headers.APPLICATION_JSON];

const RESOURCES_QUERY: string = `${TsoConstants.RESOURCE}/${TsoConstants.RES_START_TSO}/${SERVLET_KEY}`;

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const PRETEND_ZOSMF_RESPONSE: IZosmfTsoResponse = {
    servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
    queueID: "4",
    ver: "0100",
    reused: false,
    timeout: false
};

const PRETEND_BAD_ZOSMF_RESPONSE: IZosmfTsoResponse = {
    servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
    ver: "0100",
    msgData: [{
        messageText: "IZUG1126E: z/OSMF cannot correlate the request for key \"ZOSMFAD-SYS2-55-aaakaaac\" with an active z/OS application session.",
        messageId: "IZUG1126E",
        stackTrace: "Exception error"
    }],
    reused: false,
    timeout: false
};

const PRETED_ZOSMF_ERROR_MESSAGE: string = 'IZUG1126E: z/OSMF cannot correlate the request for key "ZOSMFAD-SYS2-55-aaakaaac"' +
    " with an active z/OS application session.";

function expectZosmfResponseSucceeded(response: IZosmfTsoResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
    expect(response.servletKey.length).toBeGreaterThan(1);
}

function expectZosmfResponseFailed(response: IZosmfTsoResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toEqual(msg);
}


describe("StopTso getResources", () => {

    it("should successfully return query for z/OSMF request", () => {
        let queryResponse: string;
        let error: ImperativeError;
        try {
            queryResponse = StopTso.getResources(SERVLET_KEY);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).not.toBeDefined();
        expect(queryResponse).toBeDefined();
        expect(queryResponse).toEqual(RESOURCES_QUERY);
    });

    it("should throw an error if servletKey parameter is undefined", () => {
        let queryResponse: string;
        let error: ImperativeError;
        try {
            queryResponse = StopTso.getResources(undefined);
            Imperative.console.info(`Response ${inspect(queryResponse)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect(error).toBeDefined();
        expect(queryResponse).not.toBeDefined();
        expect(error.details.msg).toEqual(noServletKeyInput.message);
    });

    it("should throw an error if servletKey parameter is empty string", () => {
        let queryResponse: string;
        let error: ImperativeError;
        try {
            queryResponse = StopTso.getResources(undefined);
            Imperative.console.info(`Response ${inspect(queryResponse)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect(error).toBeDefined();
        expect(queryResponse).not.toBeDefined();
        expect(error.details.msg).toEqual(noServletKeyInput.message);
    });

});

describe("StopTso stopCommon", () => {

    it("should succeed with correct parameters", async () => {
        (ZosmfRestClient.deleteExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(PRETEND_ZOSMF_RESPONSE);
                });
            });
        });
        let response: IZosmfPingResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stopCommon(PRETEND_SESSION, STOP_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
        }
        expect((ZosmfRestClient.deleteExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.deleteExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, RESOURCES_QUERY,
            STOP_HEADERS);
        expectZosmfResponseSucceeded(response, error);
    });

    it("should throw an error if session parameter is undefined", async () => {
        let response: IZosmfPingResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stopCommon(undefined, STOP_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionTso.message);
    });

    it("should throw an error if servletKey parameter is undefined", async () => {
        let response: IZosmfPingResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stopCommon(undefined, STOP_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionTso.message);
    });

    it("should throw an error if servletKey parameter is empty string", async () => {
        let response: IZosmfPingResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stopCommon(undefined, STOP_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionTso.message);
    });

});

describe("StopTso stop", () => {

    it("should succeed with all correctly provided parameters", async () => {
        (StopTso.stopCommon as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(PRETEND_ZOSMF_RESPONSE);
                });
            });
        });
        let response: IStartStopResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stop(PRETEND_SESSION, SERVLET_KEY);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).not.toBeDefined();
        expect((StopTso.stopCommon as any)).toHaveBeenCalledTimes(1);
        expect((StopTso.stopCommon as any)).toHaveBeenCalledWith(PRETEND_SESSION, STOP_PARMS);
        expect(response).toBeDefined();
        expect(response.success).toEqual(true);
        expect(response.servletKey.length).toBeGreaterThan(1);
    });

    it("should throw an error if session is undefined", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stop(undefined, SERVLET_KEY);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(noSessionTso.message);
    });

    it("should throw an error if servlet key is undefined", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stop(PRETEND_SESSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(noServletKeyInput.message);
    });

    it("should throw an error if servlet key is empty string", async () => {
        let response: IStartStopResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stop(PRETEND_SESSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(noServletKeyInput.message);
    });

    it("should throw an error if servlet key is inactive", async () => {
        (StopTso.stopCommon as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(PRETEND_BAD_ZOSMF_RESPONSE);
                });
            });
        });

        let response: IStartStopResponse;
        let error: ImperativeError;
        try {
            response = await StopTso.stop(PRETEND_SESSION, SERVLET_KEY);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((StopTso.stopCommon as any)).toHaveBeenCalledTimes(1);
        expect((StopTso.stopCommon as any)).toHaveBeenCalledWith(PRETEND_SESSION, STOP_PARMS);
        expect(error).toBeDefined();
        expect(response).not.toBeDefined();
        expect(error.details.msg).toEqual(PRETED_ZOSMF_ERROR_MESSAGE);
    });

});

