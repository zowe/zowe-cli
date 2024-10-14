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

/* eslint-disable deprecation/deprecation */
import { ImperativeConfig, ImperativeError, Session } from "@zowe/imperative";
import {
    IIssueTsoParms,
    ISendResponse,
    IssueTso,
    IStartStopResponse,
    IStartTsoParms,
    IZosmfTsoResponse,
    SendTso,
    StartTso,
    StopTso,
} from "../../src";
import { CheckStatus } from "@zowe/zosmf-for-zowe-sdk";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";

const PRETEND_SESSION = new Session({
    user: "user",
    password: "password",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false,
});
const SEND_RESPONSE = {
    success: true,
    zosmfResponse: {},
    commandResponse: "messages",
};
const PRETEND_REQUIRED_PARMS: IStartTsoParms = {
    logonProcedure: "IZUFPROC",
    characterSet: "697",
    codePage: "1047",
    rows: "24",
    columns: "80",
    regionSize: "4096",
    account: "DEFAULT",
};
const PRETEND_ISSUE_PARMS: IIssueTsoParms = {
    startParams: PRETEND_REQUIRED_PARMS,
    command: "COMMAND",
    accountNumber: "acc",
};
const ZOSMF_RESPONSE: IZosmfTsoResponse = {
    servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
    queueID: "4",
    ver: "0100",
    reused: false,
    timeout: false,
    sessionID: "0x37",
    tsoData: [
        {
            "TSO MESSAGE": {
                VERSION: "0100",
                DATA: "ZOSMFAD LOGON IN PROGRESS AT 01:12:04 ON JULY 17, 2017",
            },
        },
    ],
};
const START_RESPONSE: IStartStopResponse = {
    success: true,
    zosmfTsoResponse: ZOSMF_RESPONSE,
    servletKey: ZOSMF_RESPONSE.servletKey,
};
describe("all tests", () => {
    describe("TsoIssue issueTsoCommand - failing scenarios", () => {
        it("should fail for null account number", async () => {
            let error: ImperativeError;
            let response: ISendResponse;

            try {
                response = await IssueTso.issueTsoCommand(
                    PRETEND_SESSION,
                    null,
                    "command"
                );
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
                response = await IssueTso.issueTsoCommand(
                    PRETEND_SESSION,
                    "",
                    "command"
                );
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
                response = await IssueTso.issueTsoCommand(
                    PRETEND_SESSION,
                    "acc",
                    null
                );
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
                response = await IssueTso.issueTsoCommand(
                    PRETEND_SESSION,
                    "acc",
                    ""
                );
            } catch (thrownError) {
                error = thrownError;
            }
            expect(response).not.toBeDefined();
            expect(error).toBeDefined();
        });
        it("should fail when StartTSO fails", async () => {
            jest.spyOn(CheckStatus, "isZosVersionAtLeast").mockReturnValue(
                Promise.resolve(false)
            );
            let error: ImperativeError;
            let response: ISendResponse;

            jest.spyOn(StartTso, "start").mockResolvedValueOnce({
                success: false,
            } as any);
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                config: {
                    api: {
                        profiles: { defaultGet: () => ({ account: "acc" }) },
                    },
                },
            } as any);
            try {
                response = await IssueTso.issueTsoCommand(
                    PRETEND_SESSION,
                    "acc",
                    "command"
                );
            } catch (thrownError) {
                error = thrownError;
            }
            expect(response).not.toBeDefined();
            expect(error).toBeDefined();
            expect(error.message).toBe("TSO address space failed to start.");
        });
    });

    describe("TsoIssue issueTsoCommand - Deprecated API", () => {
        it("should succeed", async () => {
            jest.spyOn(CheckStatus, "isZosVersionAtLeast").mockReturnValue(
                Promise.resolve(false)
            );
            (StartTso.start as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(START_RESPONSE);
                    });
                });
            });
            (SendTso.getAllResponses as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve({});
                    });
                });
            });
            (SendTso.sendDataToTSOCollect as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(SEND_RESPONSE);
                    });
                });
            });
            (StopTso.stop as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(null);
                    });
                });
            });
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                config: {
                    api: {
                        profiles: { defaultGet: () => ({ account: "acc" }) },
                    },
                },
            } as any);
            let error: ImperativeError;
            let response: ISendResponse;
            try {
                response = await IssueTso.issueTsoCommand(
                    PRETEND_SESSION,
                    "acc",
                    "command"
                );
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error).not.toBeDefined();
            expect(response).toBeDefined();
        });

        it("should succeed (with params)", async () => {
            (IssueTso.issueTsoCommand as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve({});
                    });
                });
            });
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                config: {
                    api: {
                        profiles: { defaultGet: () => ({ account: "acc" }) },
                    },
                },
            } as any);
            let error: ImperativeError;
            let response: ISendResponse;
            try {
                response = await IssueTso.issueTsoCommandCommon(
                    PRETEND_SESSION,
                    PRETEND_ISSUE_PARMS
                );
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error).not.toBeDefined();
            expect(response).toBeDefined();
        });
    });

    describe("TsoIssue issueTsoCmd - Revised API", () => {
        it("should succeed", async () => {
            (StartTso.start as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(START_RESPONSE);
                    });
                });
            });
            (SendTso.getAllResponses as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve({});
                    });
                });
            });
            (SendTso.sendDataToTSOCollect as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(SEND_RESPONSE);
                    });
                });
            });
            (StopTso.stop as any) = jest.fn(() => {
                return new Promise((resolve) => {
                    process.nextTick(() => {
                        resolve(null);
                    });
                });
            });

            let error: ImperativeError;
            let response: ISendResponse;
            const zosmfResponse = {
                cmdResponse: [
                    {
                        message:
                            "IKJ56650I TIME-09:42:15 AM. CPU-00:00:00 SERVICE-555 SESSION-00:04:15 SEPTEMBER 4,2024",
                    },
                    { message: "READY " },
                ],
                tsoPromptReceived: "Y",
            };
            jest.spyOn(ZosmfRestClient, "putExpectJSON").mockReturnValueOnce(
                Promise.resolve(zosmfResponse)
            );
            jest.spyOn(CheckStatus, "isZosVersionAtLeast").mockReturnValue(
                Promise.resolve(true)
            );
            try {
                response = await IssueTso.issueTsoCmd(PRETEND_SESSION, "TEST");
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error).not.toBeDefined();
            expect(response).toBeDefined();
        });

        it("should succeed (with params)", async () => {
            let error: ImperativeError;
            let response: ISendResponse;

            // Mock the CheckStatus to simulate Z/OS version check
            jest.spyOn(
                CheckStatus,
                "isZosVersionAtLeast"
            ).mockReturnValueOnce(Promise.resolve(true));
            const zosmfResponse = {
                cmdResponse: [
                    {
                        message:
                            "IKJ56650I TIME-09:42:15 AM. CPU-00:00:00 SERVICE-555 SESSION-00:04:15 SEPTEMBER 4,2024",
                    },
                    { message: "READY " },
                ],
                tsoPromptReceived: "Y",
            };
            jest.spyOn(ZosmfRestClient, "putExpectJSON").mockReturnValueOnce(
                Promise.resolve(zosmfResponse)
            );
            try {
                response = await IssueTso.issueTsoCmd(
                    PRETEND_SESSION,
                    "command",
                    {
                        isStateful: true,
                        suppressStartupMessages: false,
                    }
                );
            } catch (thrownError) {
                error = thrownError;
            }

            expect(error).not.toBeDefined();
            expect(response).toBeDefined();
        });

        it("should utilize new API logic path", async () => {
            const zosmfResponse = {
                cmdResponse: [
                    {
                        message:
                            "IKJ56650I TIME-09:42:15 AM. CPU-00:00:00 SERVICE-555 SESSION-00:04:15 SEPTEMBER 4,2024",
                    },
                    { message: "READY " },
                ],
                tsoPromptReceived: "Y",
            };
            jest.spyOn(ZosmfRestClient, "putExpectJSON").mockReturnValueOnce(
                Promise.resolve(zosmfResponse)
            );
            let error: ImperativeError;
            let response: ISendResponse;
            jest.spyOn(CheckStatus, "isZosVersionAtLeast").mockReturnValue(
                Promise.resolve(true)
            );
            try {
                response = await IssueTso.issueTsoCmd(PRETEND_SESSION, "TIME", {
                    addressSpaceOptions: null,
                    isStateful: true,
                    suppressStartupMessages: true,
                });
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error).not.toBeDefined();
            expect(response).toBeDefined();
        });

        it("should throw and handle non-404 error", async () => {

            // Mock ZosmfRestClient to throw an error
            jest.spyOn(ZosmfRestClient, "putExpectJSON").mockRejectedValueOnce(
                new ImperativeError({
                    msg: "status 403",
                })
            );

            let error: ImperativeError;
            let response: ISendResponse;

            try {
                response = await IssueTso.issueTsoCmd(PRETEND_SESSION, "TIME", {
                    addressSpaceOptions: null,
                    isStateful: true,
                    suppressStartupMessages: true,
                });
            } catch (thrownError) {
                error = thrownError;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe("status 403");
            expect(response).not.toBeDefined();
        });
    });

    describe("TsoIssue issueTsoCmd - failing scenarios", () => {
        it("should fail for null command text", async () => {
            let error: ImperativeError;
            let response: ISendResponse;
            jest.spyOn(CheckStatus, "isZosVersionAtLeast").mockReturnValue(
                Promise.resolve(true)
            );
            try {
                response = await IssueTso.issueTsoCmd(
                    PRETEND_SESSION,
                    "fake_command",
                    {
                        isStateful: true,
                        suppressStartupMessages: false,
                    }
                );
            } catch (thrownError) {
                error = thrownError;
            }
            expect(response).not.toBeDefined();
            expect(error).toBeDefined();
        });
        it("should fail for empty command text", async () => {
            jest.clearAllMocks();
            let error: ImperativeError;
            let response: ISendResponse;

            jest.spyOn(ZosmfRestClient, "putExpectJSON").mockRejectedValueOnce(
                new ImperativeError({
                    msg: "status 403",
                })
            );
            jest.spyOn(CheckStatus, "isZosVersionAtLeast").mockReturnValue(
                Promise.resolve(true)
            );
            try {
                response = await IssueTso.issueTsoCmd(PRETEND_SESSION, "", {
                    isStateful: true,
                    suppressStartupMessages: false,
                });
            } catch (thrownError) {
                error = thrownError;
            }
            expect(response).not.toBeDefined();
            expect(error).toBeDefined();
        });
    });
});
