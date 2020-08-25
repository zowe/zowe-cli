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

import { Headers, Imperative, ImperativeError, Session } from "@zowe/imperative";
import { IPingResponse, IZosmfPingResponse, noPingInput, PingTso } from "../../";
import { ZosmfHeaders, ZosmfRestClient } from "../../";
import { inspect } from "util";


const ISSUE_HEADERS: any[] = [ZosmfHeaders.X_CSRF_ZOSMF_HEADER, Headers.APPLICATION_JSON];
const START_RESOURCES = "/zosmf/tsoApp/tso/ping/UZUST01-154-aacaaaaz";
const servletKey = "UZUST01-154-aacaaaaz";

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const payload: any = null;

const ZOSMF_RESPONSE: IZosmfPingResponse = {
    servletKey: "UZUST01-154-aacaaaae",
    ver: "0100",
    reused: false,
    timeout: false
};
const BAD_ZOSMF_RESPONSE: IZosmfPingResponse = {
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

function expectZosmfResponseSucceeded(response: IPingResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IPingResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}


describe("PingTsoCommand Test", () => {
    it("should return ping response if a correct servlet key was provided", async () => {
        (ZosmfRestClient.putExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });
        let error: ImperativeError;
        let response: IPingResponse;
        try {
            response = await PingTso.ping(PRETEND_SESSION, servletKey);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ZosmfRestClient.putExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.putExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCES,
            ISSUE_HEADERS, payload);
        expectZosmfResponseSucceeded(response, error);
    });
    it("should return response if an invalid servlet key was provided", async () => {
        (ZosmfRestClient.putExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });
        let error: ImperativeError;
        let response: IPingResponse;
        try {
            response = await PingTso.ping(PRETEND_SESSION, servletKey);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ZosmfRestClient.putExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.putExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCES,
            ISSUE_HEADERS, payload);
        expectZosmfResponseSucceeded(response, error);
    });

    it("should throw an error if no servlet key was provided", async () => {
        let error: ImperativeError;
        let response: IPingResponse;
        try {
            response = await PingTso.ping(PRETEND_SESSION, null);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noPingInput.message);
    });
});
