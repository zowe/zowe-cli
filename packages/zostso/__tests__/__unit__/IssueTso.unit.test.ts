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
import { IIssueTsoParms, ISendResponse, IssueTso, IStartTsoParms, SendTso, StartTso, StopTso, IZosmfTsoResponse } from "../../src";

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
const PRETEND_REQUIRED_PARMS: IStartTsoParms = {
    logonProcedure: "IZUFPROC",
    characterSet: "697",
    codePage: "1047",
    rows: "24",
    columns: "80",
    regionSize: "4096",
    account: "DEFAULT"
};
const PRETEND_ISSUE_PARMS: IIssueTsoParms = {
    startParams: PRETEND_REQUIRED_PARMS,
    command: "COMMAND",
    accountNumber: "acc"
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
    }]
};


describe("TsoIssue issueTsoCommand - failing scenarios", () => {

    it("should fail for null account number", async () => {
        let error: ImperativeError;
        let response: ISendResponse;

        try {
            response = await IssueTso.issueTsoCommand(PRETEND_SESSION, null, "command");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
    });
    it("should fail for empty account number", async () => {
        let error: ImperativeError;
        let response: ISendResponse;

        try {
            response = await IssueTso.issueTsoCommand(PRETEND_SESSION, "", "command");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
    });
    it("should fail for null command text", async () => {
        let error: ImperativeError;
        let response: ISendResponse;

        try {
            response = await IssueTso.issueTsoCommand(PRETEND_SESSION, "acc", null);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
    });
    it("should fail for empty command text", async () => {
        let error: ImperativeError;
        let response: ISendResponse;

        try {
            response = await IssueTso.issueTsoCommand(PRETEND_SESSION, "acc", "");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
    });
});

describe("TsoIssue issueTsoCommand", () => {
    it("should succeed", async () => {
        (StartTso.start as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });
        (SendTso.getAllResponses as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve({});
                });
            });
        });
        (SendTso.sendDataToTSOCollect as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(SEND_RESPONSE);
                });
            });
        });
        (StopTso.stop as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(null);
                });
            });
        });

        let error: ImperativeError;
        let response: ISendResponse;
        try {
            response = await IssueTso.issueTsoCommand(PRETEND_SESSION, "acc", "command");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
    });

    it("should succeed (with params)", async () => {
        (IssueTso.issueTsoCommand as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve({});
                });
            });
        });
        let error: ImperativeError;
        let response: ISendResponse;
        try {
            response = await IssueTso.issueTsoCommandCommon(PRETEND_SESSION, PRETEND_ISSUE_PARMS);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
    });
});

