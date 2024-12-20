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

import { Session } from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { AddressSpaceApps } from "../../src";
import { ITsoAppCommunicationParms } from "../../src/doc/input/ITsoAppCommunicationParms";

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false,
});

const MOCK_RECEIVE_RESPONSE: any = {
    version: undefined,
    reused: false,
    timeout: false,
    servletKey: "ZOWEUSER-127-aabeaaag",
    queueID: null,
    tsoData: [
        {
            "TSO MESSAGE": { VERSION: "0100", DATA: "Processing started." },
        },
        {
            "TSO MESSAGE": { VERSION: "0100", DATA: "READY" },
        },
    ],
};

const MOCK_TIMEOUT_RESPONSE: any = {
    version: undefined,
    reused: false,
    timeout: true,
    servletKey: "ZOWEUSER-127-aabeaaag",
    queueID: null,
    tsoData: [],
};

describe("ReceiveTsoApp behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should format a successful response to match expected syntax", async () => {
        jest.spyOn(ZosmfRestClient, "getExpectJSON").mockResolvedValueOnce(
            MOCK_RECEIVE_RESPONSE
        );

        const params: ITsoAppCommunicationParms = {
            servletKey: "ZOWEUSER-127-aabeaaag",
            appKey: "someAppKey",
            timeout: 10,
            receiveUntilReady: true,
        };

        const response = await AddressSpaceApps.receive(
            PRETEND_SESSION,
            "123456",
            params
        );

        expect(ZosmfRestClient.getExpectJSON).toHaveBeenCalledWith(
            PRETEND_SESSION,
            `/zosmf/tsoApp/app/${params.servletKey}/${params.appKey}`
        );

        expect(response).toEqual({
            version: undefined,
            reused: false,
            timeout: false,
            servletKey: "ZOWEUSER-127-aabeaaag",
            queueID: null,
            tsoData: [
                { VERSION: "0100", DATA: "Processing started." },
                { VERSION: "0100", DATA: "READY" },
            ],
        });
    });

    it("should stop receiving when 'READY' keyword is detected", async () => {
        jest.spyOn(ZosmfRestClient, "getExpectJSON").mockResolvedValueOnce(
            MOCK_RECEIVE_RESPONSE
        );

        const params: ITsoAppCommunicationParms = {
            servletKey: "ZOWEUSER-127-aabeaaag",
            appKey: "someAppKey",
            timeout: 10,
            receiveUntilReady: true,
        };

        const response = await AddressSpaceApps.receive(
            PRETEND_SESSION,
            "123456",
            params
        );

        expect(ZosmfRestClient.getExpectJSON).toHaveBeenCalledTimes(1); // Should only call once
        expect(
            response.tsoData.some((data) => data.DATA === "READY")
        ).toBeTruthy();
    });

    it("should handle timeout by returning a partial response if timeout occurs", async () => {
        jest.spyOn(ZosmfRestClient, "getExpectJSON").mockResolvedValueOnce(
            MOCK_TIMEOUT_RESPONSE
        );

        const params: ITsoAppCommunicationParms = {
            servletKey: "ZOWEUSER-127-aabeaaag",
            appKey: "someAppKey",
            timeout: 1,
            receiveUntilReady: true,
        };

        const response = await AddressSpaceApps.receive(
            PRETEND_SESSION,
            "123456",
            params
        );

        expect(response).toEqual(MOCK_TIMEOUT_RESPONSE);
        expect(response.timeout).toBe(true);
    });

    it("should throw an error if an error occurs and no partial response is available", async () => {
        jest.spyOn(ZosmfRestClient, "getExpectJSON").mockRejectedValueOnce(
            new Error("Network error")
        );

        const params: ITsoAppCommunicationParms = {
            servletKey: "ZOWEUSER-127-aabeaaag",
            appKey: "someAppKey",
            timeout: 10,
            receiveUntilReady: true,
        };

        await expect(
            AddressSpaceApps.receive(PRETEND_SESSION, "123456", params)
        ).rejects.toThrow("Network error");
    });

    it("should append multiple responses to combinedResponse.tsoData", async () => {
        // Mock the first response without "READY" to simulate multiple API calls
        const mockResponse1: any = {
            version: "0100",
            reused: false,
            timeout: false,
            servletKey: "ZOWEUSER-127-aabeaaag",
            queueID: null,
            tsoData: [{"TSO MESSAGE":{ VERSION: "0100", DATA: "First response data." }}],
        };

        // Mock the second response containing "READY" to trigger stopping condition
        const mockResponse2: any = {
            version: "0100",
            reused: false,
            timeout: false,
            servletKey: "ZOWEUSER-127-aabeaaag",
            queueID: null,
            tsoData: [
                {"TSO MESSAGE":{ VERSION: "0100", DATA: "Second response data." }},
                {"TSO MESSAGE":{ VERSION: "0100", DATA: "READY" }}
            ],
        };

        // Set up mock to return these responses in sequence
        jest.spyOn(ZosmfRestClient, "getExpectJSON")
            .mockResolvedValueOnce(mockResponse1) // First call
            .mockResolvedValueOnce(mockResponse2); // Second call

        const params: ITsoAppCommunicationParms = {
            servletKey: "ZOWEUSER-127-aabeaaag",
            appKey: "someAppKey",
            timeout: 10,
            receiveUntilReady: true,
        };

        const response = await AddressSpaceApps.receive(
            PRETEND_SESSION,
            "123456",
            params
        );

        expect(response.tsoData).toEqual([
            { VERSION: "0100", DATA: "First response data." },
            { VERSION: "0100", DATA: "Second response data." },
            { VERSION: "0100", DATA: "READY" },
        ]);
        expect(ZosmfRestClient.getExpectJSON).toHaveBeenCalledTimes(2); // Two calls due to no "READY" in the first response
    });
});
