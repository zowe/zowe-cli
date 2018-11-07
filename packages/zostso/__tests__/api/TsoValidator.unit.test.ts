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

import {
    IStartTsoParms,
    IStopTsoParms,
    IZosmfPingResponse,
    IZosmfTsoResponse,
    noPingInput,
    noSessionTso,
    noTsoStartInput,
    noTsoStopInput,
    noZosmfResponse,
    TsoValidator
} from "../../../zostso";
import { Session } from "@brightside/imperative";

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const PRETEND_START_PARMS: IStartTsoParms = {
    logonProcedure: "IZUFPROC",
    characterSet: "697",
    codePage: "1047",
    rows: "24",
    columns: "80",
    regionSize: "4096"
};

const PRETEND_STOP_PARMS: IStopTsoParms = {
    servletKey: "ZOSMFAD-SYS2-55-aaakaaac"
};

const ZOSMF_RESPONSE: IZosmfTsoResponse = {
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

const BAD_ZOSMF_RESPONSE: IZosmfTsoResponse = {
    servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
    ver: "0100",
    msgData: [{
        messageText: "IZUG1126E: z/OSMF cannot correlate the request for key \"ZOSMFAD-SYS2-55-aaakaaac\"" +
        " with an active z/OS application session.",
        messageId: "IZUG1126E",
        stackTrace: "Exception error"
    }],
    reused: false,
    timeout: false
};

const zosmfErrorMessage = "IZUG1126E: z/OSMF cannot correlate the request" +
    ' for key "ZOSMFAD-SYS2-55-aaakaaac" with an active z/OS application session.';

describe("TsoValidator", () => {
    it("validateSession should throw an error if session parameter is undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateSession(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noSessionTso.message);
    });

    it("validateSession shouldn't throw an error if session parameter is provided", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateSession(PRETEND_SESSION);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).not.toBeDefined();
        expect(error).toEqual(undefined);
    });

    it("validateStartParams should throw an error if parameters are undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateStartParams(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noTsoStartInput.message);
    });

    it("validateStartParams shouldn't throw an error if parameters are provided", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateStartParams(PRETEND_START_PARMS);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).not.toBeDefined();
        expect(error).toEqual(undefined);
    });

    it("validateStartZosmfResponse should throw an error if parameter is undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateStartZosmfResponse(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noZosmfResponse.message);
    });

    it("validateStartZosmfResponse shouldn't throw an error if parameter is provided", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateStartZosmfResponse(ZOSMF_RESPONSE);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).not.toBeDefined();
        expect(error).toEqual(undefined);
    });

    it("validatePingZosmfResponse should throw an error if parameter is undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validatePingZosmfResponse(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noZosmfResponse.message);
    });

    it("validatePingZosmfResponse shouldn't throw an error if parameter is provided", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validatePingZosmfResponse(ZOSMF_RESPONSE);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).not.toBeDefined();
        expect(error).toEqual(undefined);
    });

    it("validateNotEmptyString should throw an error if parameter is undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateNotEmptyString(undefined, noPingInput.message);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noPingInput.message);
    });

    it("validatePingZosmfResponse shouldn't throw an error if parameter is provided", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateNotEmptyString(ZOSMF_PING_RESPONSE.servletKey, noPingInput.message);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).not.toBeDefined();
        expect(error).toEqual(undefined);
    });

    it("validateString should throw an error if parameter is undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateString(undefined, noPingInput.message);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noPingInput.message);
    });

    it("validateString shouldn't throw an error if parameter is provided", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateString(ZOSMF_PING_RESPONSE.servletKey, noPingInput.message);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).not.toBeDefined();
        expect(error).toEqual(undefined);
    });
    // validatePingParms(session: AbstractSession, text: string, errorMsg: string)
    it("validatePingParms shouldn't throw an error if parameter is provided", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validatePingParms(PRETEND_SESSION, ZOSMF_PING_RESPONSE.servletKey, noPingInput.message);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).not.toBeDefined();
        expect(error).toEqual(undefined);
    });

    it("validatePingParms should throw an error if session is undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validatePingParms(undefined, ZOSMF_PING_RESPONSE.servletKey, noPingInput.message);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noSessionTso.message);
    });

    it("validatePingParms should throw an error if string is undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validatePingParms(PRETEND_SESSION, undefined, noPingInput.message);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noPingInput.message);
    });

    it("validatePingParms should throw an error if both session and string are undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validatePingParms(undefined, undefined, noPingInput.message);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noSessionTso.message);
    });

    it("validateStopParams should throw an error if parameter is undefined", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateStopParams(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(noTsoStopInput.message);
    });

    it("validateStopParams shouldn't throw an error if parameter is provided", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateStopParams(PRETEND_STOP_PARMS);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).not.toBeDefined();
        expect(error).toEqual(undefined);
    });

    it("validateErrorMessageFromZosmf should throw an error if z/OSMF response contains", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateErrorMessageFromZosmf(BAD_ZOSMF_RESPONSE);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toEqual(zosmfErrorMessage);
    });

    it("validateErrorMessageFromZosmf shouldn't throw an error if z/OSMF response doesn't have error message", () => {
        let response;
        let error;
        try {
            response = TsoValidator.validateErrorMessageFromZosmf(ZOSMF_RESPONSE);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).not.toBeDefined();
        expect(error).toEqual(undefined);
    });
});
