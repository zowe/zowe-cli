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

import { ImperativeError } from "@zowe/imperative";
import { IPingResponse, IStartStopResponse, IZosmfPingResponse, IZosmfTsoResponse, noZosmfResponse, TsoResponseService } from "../../../zostso";

const PRETEND_ZOSMF_RESPONSE: IZosmfTsoResponse = {
    servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
    queueID: "4",
    ver: "0100",
    reused: false,
    timeout: false,
    sessionID: "0x37",
    tsoData: [{
        "TSO MESSAGE": {
            VERSION: "0100",
            DATA: "ZOSMFAD LOGON IN PROGRESS AT 01:12:04 ON JULY 17, 2017"
        }
    }],
};

const ZOSMF_PING_RESPONSE: IZosmfPingResponse = {
    servletKey: "UZUST01-154-aacaaaae",
    ver: "0100",
    msgData: [{
        messageText: "IZUG1126E: z/OSMF cannot correlate the request for key",
        messageId: "IZUG1126E",
        stackTrace: "Exception error"
    }],
    reused: false,
    timeout: false
};

const PRETEND_START_RESPONSE: IStartStopResponse = {
    success: true,
    zosmfTsoResponse: PRETEND_ZOSMF_RESPONSE,
    servletKey: PRETEND_ZOSMF_RESPONSE.servletKey
};

const PRETEND_PING_RESPONSE: IPingResponse = {
    success: true,
    zosmfPingResponse: ZOSMF_PING_RESPONSE,
    servletKey: ZOSMF_PING_RESPONSE.servletKey
};

function expectStartResponseSucceeded(response: IStartStopResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
    expect(response).toEqual(PRETEND_START_RESPONSE);
}


function expectStartResponseFailed(response: IStartStopResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

function expectPingResponseSucceeded(response: IPingResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
    expect(response).toEqual(PRETEND_PING_RESPONSE);
}

function expectPingResponseFailed(response: IPingResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("TsoResponseService populateStartAndStop", () => {

    it("should succeed and return object with IStartStopResponse type", () => {
        let startResponse;
        let error;
        try {
            startResponse = TsoResponseService.populateStartAndStop(PRETEND_ZOSMF_RESPONSE);
        } catch (thrownError) {
            error = thrownError;
        }
        expectStartResponseSucceeded(startResponse, error);
    });

    it("should fail if method doesn't receive parameter", () => {
        let startResponse;
        let error;
        try {
            startResponse = TsoResponseService.populateStartAndStop(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expectStartResponseFailed(startResponse, error, noZosmfResponse.message);
    });
});

describe("TsoResponseService populatePing", () => {

    it("should succeed and return object with IPingResponse type", () => {
        let pingResponse;
        let error;
        try {
            pingResponse = TsoResponseService.populatePing(ZOSMF_PING_RESPONSE);
        } catch (thrownError) {
            error = thrownError;
        }
        expectPingResponseSucceeded(pingResponse, error);
    });

    it("should fail if method doesn't receive parameter", () => {
        let pingResponse;
        let error;
        try {
            pingResponse = TsoResponseService.populatePing(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expectPingResponseFailed(pingResponse, error, noZosmfResponse.message);
    });
});
