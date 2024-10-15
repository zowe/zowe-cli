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
import { StartTsoApp } from "@zowe/zos-tso-for-zowe-sdk";
import { IASAppResponse } from "@zowe/zos-tso-for-zowe-sdk/src/doc/IASAppResponse";

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false,
});

const MOCK_RESPONSE = Promise.resolve({
    version: "0100",
    reused: false,
    timeout: false,
    servletKey: "JR897694-123-aaaaaa",
    queueID: "983068",
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
                DATA: "UNIX message queue id = 983068",
            },
        },
        {
            "TSO MESSAGE": {
                VERSION: "0100",
                DATA: "Input message type = 32772",
            },
        },
        { "TSO MESSAGE": { VERSION: "0100", DATA: "Output message type = 4" } },
        {
            "TSO MESSAGE": {
                VERSION: "0100",
                DATA: "Reading application input from the UNIX message queue.",
            },
        },
    ],
});
describe("start TSO app handler behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return mocked value and validate tso data", async () => {
        jest.spyOn(ZosmfRestClient, "postExpectJSON").mockReturnValue(
            MOCK_RESPONSE
        );
        let response = undefined;
        let error = undefined;
        try {
            response = await StartTsoApp.start(
                PRETEND_SESSION,
                "izuacct",
                {
                    startupCommand: "EXEC 'TEST.EXEC(THISSCRIPTDOESNOTEXIST)'",
                    appKey: "testappkey",
                    queueID: "12345",
                    servletKey: "JR897694-123-aaaaaaaa",
                },
                null
            );
        } catch (e) {
            error = e;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        expect(response.tsoData.length).toEqual(5);
    });
});
