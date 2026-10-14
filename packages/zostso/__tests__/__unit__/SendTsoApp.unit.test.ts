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
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { AddressSpaceApps, noAppKeyInput } from "../../src";
import { ITsoAppCommunicationParms } from "../../src/doc/input/ITsoAppCommunicationParms";
import { IASAppResponse } from "../../src/doc/IASAppResponse";

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false,
});

const MOCK_SEND_RESPONSE = Promise.resolve({
    servletKey: "ZOWEUSER-127-aabeaaag",
    ver: "0100",
    tsoData: [
        {
            "TSO MESSAGE": {
                VERSION: "0100",
                DATA: "HELLOW exec processing has started.",
            },
        },
        {
            "TSO MESSAGE": {
                VERSION: "0100",
                DATA: "UNIX message queue id = 1048608",
            },
        },
    ],
    reused: false,
    timeout: false,
});

describe("SendTsoApp behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should send a TSO application message and receive a response", async () => {
        jest.spyOn(ZosmfRestClient, "putExpectJSON").mockReturnValue(
            MOCK_SEND_RESPONSE
        );

        const params: ITsoAppCommunicationParms = {
            servletKey: "ZOWEUSER-127-aabeaaag",
            appKey: "someAppKey",
            message: "Test message",
        };

        const response = await AddressSpaceApps.send(
            PRETEND_SESSION,
            "123456",
            params,
            null
        );

        expect(ZosmfRestClient.putExpectJSON).toHaveBeenCalledWith(
            PRETEND_SESSION,
            `/zosmf/tsoApp/app/${params.servletKey}/${params.appKey}`,
            [expect.any(String), "text/plain"],
            params.message
        );

        expect(response).toEqual({
            version: "0100",
            reused: false,
            timeout: false,
            servletKey: "ZOWEUSER-127-aabeaaag",
            queueID: null,
            tsoData: [
                {
                    VERSION: "0100",
                    DATA: "HELLOW exec processing has started.",
                },
                {
                    VERSION: "0100",
                    DATA: "UNIX message queue id = 1048608",
                },
            ],
        });
    });

    test.each(
        ["aef?-bieioe", "../myFile.txt", "example.com", "aefabie?myQueryParam",
            "lucky#9", "contains+plus", "any%complete"]
    )('should reject the servlet key %s which has invalid characters', async (servletKey) => {
        let error: ImperativeError;
        let response: IASAppResponse;
        try {
            response = await AddressSpaceApps.send(
                PRETEND_SESSION,
                "123456",
                {
                    servletKey,
                    appKey: "somethingValid",
                    message: "Bad"
                },
                null
            );
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.message).toBe("The servletKey contains illegal characters.");
    });
    test.each(
        ["aef?-bieioe", "../myFile.txt", "example.com", "aefabie?myQueryParam",
            "lucky#9", "contains+plus", "any%complete"]
    )('should reject the appKey %s which has invalid characters', async (appKey) => {
        let error: ImperativeError;
        let response: IASAppResponse;
        try {
            response = await AddressSpaceApps.send(
                PRETEND_SESSION,
                "123456",
                {
                    appKey,
                    servletKey: "aefab-valid",
                    message: "Bad"
                },
                null
            );
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.message).toBe("The appKey contains illegal characters.");
    });

    it('should reject an empty appKey', async () => {
        let error: ImperativeError;
        let response: IASAppResponse;
        try {
            response = await AddressSpaceApps.send(
                PRETEND_SESSION,
                "123456",
                {
                    appKey: "",
                    servletKey: "aefab-valid",
                    message: "Bad"
                },
                null
            );
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.message).toContain(noAppKeyInput.message);
    });
});
