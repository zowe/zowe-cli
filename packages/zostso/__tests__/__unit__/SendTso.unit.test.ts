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
        (SendTso.sendDataToTSOCommon as any) = jest.fn((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });
        (SendTso.getAllResponses as any) = jest.fn((): Promise<object> => {
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
        (ZosmfRestClient.getExpectJSON as any) = jest.fn((): Promise<object> => {
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

