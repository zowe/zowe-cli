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
import { IASAppResponse } from "@zowe/zos-tso-for-zowe-sdk/src/doc/IASAppResponse";
import { SendTsoApp } from "@zowe/zos-tso-for-zowe-sdk";
import { ITsoAppCommunicationParms } from "@zowe/zos-tso-for-zowe-sdk/src/doc/input/ITsoAppCommunicationParms";

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false,
});

const MOCK_SEND_RESPONSE = Promise.resolve({
    servletKey: "JR897694-127-aabeaaag",
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

const params: ITsoAppCommunicationParms = {
    servletKey: "JR897694-127-aabeaaag",
    appKey: "someAppKey",
    message: "Test message",
};

describe("send TSO app handler behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should properly receive and parse data from send TSO response", async () => {
        jest.spyOn(ZosmfRestClient, "putExpectJSON").mockReturnValue(
            MOCK_SEND_RESPONSE
        );
        let response = undefined;
        let error = undefined;
        try{
            response = await SendTsoApp.send(
                PRETEND_SESSION,
                "123456",
                params,
                null
            );
        }
        catch(e)
        {
            error = e;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        expect(response.tsoData.length).toEqual(2);
    });
});
