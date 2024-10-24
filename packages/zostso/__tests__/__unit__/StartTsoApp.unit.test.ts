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
import { StartTsoApp } from "../../src";
import { StartTso } from "../../src";
import { IStartStopResponses } from "../../src";

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});
const MOCK_RESPONSE = Promise.resolve({
    version: "0100",
    reused: false,
    timeout: false,
    servletKey: "CUST009-123-aaaaaa",
    queueID: "983068",
    tsoData: [
        { "TSO MESSAGE": { VERSION: "0100", DATA: "HELLOW exec processing has started." } },
        { "TSO MESSAGE": { VERSION: "0100", DATA: "UNIX message queue id = 983068" } },
        { "TSO MESSAGE": { VERSION: "0100", DATA: "Input message type = 32772" } },
        { "TSO MESSAGE": { VERSION: "0100", DATA: "Output message type = 4" } },
        { "TSO MESSAGE": { VERSION: "0100", DATA: "Reading application input from the UNIX message queue." } }
    ]
});

const MOCK_START_RESPONSE: Promise<IStartStopResponses> = Promise.resolve({
    collectedResponses: [],
    messages: "IKJ56455I CUST009 LOGON IN PROGRESS AT 11:18:56 ON OCTOBER 14, 2024\nIKJ56951I NO BROADCAST MESSAGES\nREADY \n",
    servletKey: "CUST009-123-aaaaaa",
    success: true,
    zosmfTsoResponse: {
        ver: "0100",
        queueID: "983068",
        reused: false,
        servletKey: "CUST009-123-aaaaaa",
        sessionID: "0x00",
        timeout: false,
        tsoData: [{}]
    }
});

describe("StartTsoApp behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should issue a TSO address space and start an application at that address space", async () => {
        jest.spyOn(StartTso, "start").mockReturnValue(MOCK_START_RESPONSE);
        jest.spyOn(ZosmfRestClient, "postExpectJSON").mockReturnValue(MOCK_RESPONSE);

        const response = await StartTsoApp.start(PRETEND_SESSION, "izuacct", {
            startupCommand: "EXEC 'TEST.EXEC(THISSCRIPTDOESNOTEXIST)'",
            appKey: "testappkey",
        }, null);

        expect(StartTso.start).toHaveBeenCalled();
        expect(ZosmfRestClient.postExpectJSON).toHaveBeenCalledWith(
            PRETEND_SESSION,
            expect.stringContaining("/app/"),
            expect.any(Array),
            expect.objectContaining({
                startcmd: expect.stringContaining("THISSCRIPTDOESNOTEXIST")
            })
        );
        expect(response).toMatchObject({
            servletKey: "CUST009-123-aaaaaa",
            queueID: "983068",
            tsoData: expect.arrayContaining([
                expect.objectContaining({ DATA: "HELLOW exec processing has started." })
            ])
        });
    });
    it("should start an application at a specified existing TSO address space", async () => {
        jest.spyOn(StartTso, "start").mockReturnValue(MOCK_START_RESPONSE);
        jest.spyOn(ZosmfRestClient, "postExpectJSON").mockReturnValue(MOCK_RESPONSE);

        const response = await StartTsoApp.start(PRETEND_SESSION, "izuacct", {
            startupCommand: "EXEC 'TEST.EXEC(THISSCRIPTDOESNOTEXIST)'",
            appKey: "testappkey",
            queueID: "12345",
            servletKey: "CUST009-123-aaaaaaaa"
        }, null);

        expect(StartTso.start).not.toHaveBeenCalled();
        expect(ZosmfRestClient.postExpectJSON).toHaveBeenCalledWith(
            PRETEND_SESSION,
            expect.stringContaining("/app/"),
            expect.any(Array),
            expect.objectContaining({
                startcmd: expect.stringContaining("THISSCRIPTDOESNOTEXIST")
            })
        );
        expect(response).toMatchObject({
            servletKey: "CUST009-123-aaaaaaaa",
            queueID: "12345",
            tsoData: expect.arrayContaining([
                expect.objectContaining({ DATA: "HELLOW exec processing has started." })
            ])
        });
    });
});
