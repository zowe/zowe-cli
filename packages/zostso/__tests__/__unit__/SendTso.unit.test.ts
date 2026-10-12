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
import { ISendResponse, IZosmfTsoResponse, SendTso } from "../../src";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { TsoConstants } from "../../src/TsoConstants";

// Captured before any test gets a chance to permanently overwrite the static method below
const originalGetAllResponses = SendTso.getAllResponses;

const PRETEND_SESSION = new Session({
    user: "user",
    password: "password",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});
const SEND_RESPONSE = {
    success: true,
    zosmfResponse: {},
    commandResponse: "messages"
};
const ZOSMF_RESPONSE: IZosmfTsoResponse = {
    servletKey: "key",
    queueID: "4",
    ver: "0100",
    reused: false,
    timeout: false,
    sessionID: "0x37",
    tsoData: [{
        "TSO MESSAGE": {
            VERSION: "0100",
            DATA: "some response"
        }
    }]
};
const RESPONSE_WITH_PROMPT: IZosmfTsoResponse = {
    servletKey: "key",
    queueID: "4",
    ver: "0100",
    reused: false,
    timeout: false,
    sessionID: "0x37",
    tsoData: [{
        "TSO PROMPT": {
            VERSION: "0100",
            HIDDEN: "N"
        }
    }]
};
const RESPONSE_WITH_NO_DATA: IZosmfTsoResponse = {
    servletKey: "key",
    queueID: "4",
    ver: "0100",
    reused: false,
    timeout: false,
    sessionID: "0x37",
    tsoData: undefined
};

describe("TsoSend sendDataToTSOCollect - failing scenarios", () => {
    it("should fail for null servletKey", async () => {
        let error: ImperativeError;
        let response: ISendResponse;

        try {
            response = await SendTso.sendDataToTSOCollect(PRETEND_SESSION, null, "data");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
    });
    it("should fail for empty servletKey", async () => {
        let error: ImperativeError;
        let response: ISendResponse;

        try {
            response = await SendTso.sendDataToTSOCollect(PRETEND_SESSION, "", "data");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
    });
    it("should fail for null data", async () => {
        let error: ImperativeError;
        let response: ISendResponse;

        try {
            response = await SendTso.sendDataToTSOCollect(PRETEND_SESSION, "key", null);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
    });
    it("should fail for empty data", async () => {
        let error: ImperativeError;
        let response: ISendResponse;

        try {
            response = await SendTso.sendDataToTSOCollect(PRETEND_SESSION, "key", "");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
    });
});

describe("TsoSend sendDataToTSOCollect", () => {
    it("should succeed", async () => {
        (SendTso.sendDataToTSOCommon as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });
        (SendTso.getAllResponses as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(SEND_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: ISendResponse;
        try {
            response = await SendTso.sendDataToTSOCollect(PRETEND_SESSION, "key", "data");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(SendTso.getAllResponses as any).toHaveBeenCalledTimes(1);
    });
});

describe("TsoSend getDataFromTSO", () => {
    it("should succeed", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve({});
                });
            });
        });
        let error: ImperativeError;
        let response: IZosmfTsoResponse;
        try {
            response = await SendTso.getDataFromTSO(PRETEND_SESSION, "key");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(ZosmfRestClient.getExpectJSON as any).toHaveBeenCalledTimes(1);
    });
});

describe("TsoSend getAllResponses", () => {
    beforeEach(() => {
        // An earlier suite permanently overwrites this static method with a mock, so restore it here
        (SendTso.getAllResponses as any) = originalGetAllResponses;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it("should collect messages and stop once a TSO PROMPT is reached", async () => {
        (SendTso.getDataFromTSO as any) = jest.fn().mockResolvedValueOnce(RESPONSE_WITH_PROMPT);

        const response = await SendTso.getAllResponses(PRETEND_SESSION, ZOSMF_RESPONSE);

        expect(response.messages).toEqual("some response\n");
        expect(response.tsos).toEqual([ZOSMF_RESPONSE]);
        expect(SendTso.getDataFromTSO as any).toHaveBeenCalledTimes(1);
    });

    it("should debounce for 100ms and poll again when no tsoData is returned", async () => {
        jest.useFakeTimers();
        const getDataFromTSOMock = jest.fn()
            .mockResolvedValueOnce(RESPONSE_WITH_NO_DATA)
            .mockResolvedValueOnce(RESPONSE_WITH_PROMPT);
        (SendTso.getDataFromTSO as any) = getDataFromTSOMock;

        const responsePromise = SendTso.getAllResponses(PRETEND_SESSION, ZOSMF_RESPONSE);
        await jest.advanceTimersByTimeAsync(TsoConstants.DEFAULT_NO_DATA_DEBOUNCE);
        const response = await responsePromise;

        expect(getDataFromTSOMock).toHaveBeenCalledTimes(2);
        expect(response.messages).toEqual("some response\n");
    });

    it("should throw an error when the TSO PROMPT timeout is exceeded", async () => {
        (SendTso.getDataFromTSO as any) = jest.fn().mockResolvedValue(ZOSMF_RESPONSE);
        jest.spyOn(Date, "now")
            .mockReturnValueOnce(0) // start time
            .mockReturnValueOnce(0) // first loop iteration check, timeout not yet exceeded
            .mockReturnValue(TsoConstants.DEFAULT_PROMPT_TIMEOUT + 1); // subsequent checks exceed the timeout

        let error: ImperativeError;
        try {
            await SendTso.getAllResponses(PRETEND_SESSION, ZOSMF_RESPONSE);
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("Timed out waiting for a TSO PROMPT");
    });
});

