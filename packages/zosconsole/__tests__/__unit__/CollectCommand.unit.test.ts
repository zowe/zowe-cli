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

import { CollectCommand, ConsoleConstants, ICollectParms, IConsoleResponse, IZosmfIssueResponse } from "../index";
import { ZosmfRestClient } from "../../rest";
import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { inspect } from "util";
import { noCommandKey, noConsoleName, noSession } from "../../zosconsole/src/api/ConsoleConstants";

const PRETEND_SESSION = new Session({
    user: "user",
    password: "password",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const CUSTOM_CONSOLE: string = "custcons";
const COMMAND_RESPONSE_KEY: string = "C1046283";

const CMD_DEF_CONSOLE_COLLECT_PARMS: ICollectParms = {
    commandResponseKey: COMMAND_RESPONSE_KEY
};

const CMD_CUST_CONSOLE_COLLECT_PARMS: ICollectParms = {
    consoleName: CUSTOM_CONSOLE,
    commandResponseKey: COMMAND_RESPONSE_KEY
};

const CMD_COLLECT_FOLLOWUP2_PARMS: ICollectParms = {
    commandResponseKey: COMMAND_RESPONSE_KEY,
    followUpAttempts: 2
};

const CMD_RESPONSE: IZosmfIssueResponse = {
    "cmd-response-key": COMMAND_RESPONSE_KEY,
    "cmd-response-url": "https://host.com:443/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response-uri": "/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response": " IEE254I  09.00.16 IPLINFO DISPLAY 147\r  SYSTEM IPLED AT 14.36.04 ON 02/17/2018\r  RELEASE z/OS 02.03.00    " +
    "LICENSE = z/OS\r  USED LOAD23 IN SYS1.IPLPARM ON 00351\r  ARCHLVL = 2   MTLSHARE = N\r  IEASYM LIST = 00\r  IEASYS LIST = (00) (OP)\r  " +
    "IODF DEVICE: ORIGINAL(00351) CURRENT(00351)\r  IPL DEVICE: ORIGINAL(0AE18) CURRENT(0AE18) VOLUME(BSTR04)"
};

const FOLLOW_UP_RESPONSE1: IZosmfIssueResponse = {
    "cmd-response-key": COMMAND_RESPONSE_KEY,
    "cmd-response-url": "https://host.com:443/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response-uri": "/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response": " Part one\r  some date"
};

const FOLLOW_UP_RESPONSE2: IZosmfIssueResponse = {
    "cmd-response": "Part two\r  some data\r"
};

const FOLLOW_UP_EMPTY: IZosmfIssueResponse = {
    "cmd-response": ""
};

const FOLLOW_UP_CONSOLE_RESPONSE: IConsoleResponse = {
    success: true,
    zosmfResponse: [FOLLOW_UP_RESPONSE1],
    commandResponse: "cmdResponse",
    lastResponseKey: COMMAND_RESPONSE_KEY
};

const EXPECTED_GET_RESOURCE = CollectCommand.getResource(ConsoleConstants.RES_DEF_CN, COMMAND_RESPONSE_KEY);
const EXPECTED_CUSTOM_GET_RESOURCE = CollectCommand.getResource(CUSTOM_CONSOLE, COMMAND_RESPONSE_KEY);
const NUMBER_THREE: number = 3;
const NUMBER_FOUR: number = 4;

function expectConsoleResponseSucceeded(response: IConsoleResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
    expect(response.success).toBeTruthy();
}

function expectZosmfResponseSucceeded(response: IZosmfIssueResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IZosmfIssueResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("CollectCommand collectCommon", () => {
    /**
     * Test collectCommon with custom console     *
     * Verify that ZosmfRestClient.getExpectJSON method has been called with proper parameters
     */
    it("should get response from custom console.", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await CollectCommand.collectCommon(PRETEND_SESSION, CUSTOM_CONSOLE, COMMAND_RESPONSE_KEY);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expectZosmfResponseSucceeded(response, error);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_CUSTOM_GET_RESOURCE);
    });

    /**
     * Test parameter validation
     * Command should fail with incorrect parameters and
     */
    it("should fail if session is not provided.", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await CollectCommand.collectCommon(undefined, CUSTOM_CONSOLE, COMMAND_RESPONSE_KEY);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expectZosmfResponseFailed(response, error, noSession.message);
        expect(ZosmfRestClient.getExpectJSON).not.toHaveBeenCalled();
    });

    it("should fail if console name is not provided.", async () => {
        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await CollectCommand.collectCommon(PRETEND_SESSION, undefined, COMMAND_RESPONSE_KEY);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expectZosmfResponseFailed(response, error, noConsoleName.message);
    });

    it("should fail if command response key is not provided.", async () => {
        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await CollectCommand.collectCommon(PRETEND_SESSION, "console", undefined);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expectZosmfResponseFailed(response, error, noCommandKey.message);
    });

    it("should handle Imperative error.", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            throw new ImperativeError({msg: "Collect error message"}, {suppressReport: false, tag: "some tag"});
        });

        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await CollectCommand.collectCommon(PRETEND_SESSION, "console", COMMAND_RESPONSE_KEY);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }
        expectZosmfResponseFailed(response, error, "Collect error message");
    });
});

describe("CollectCommand collectDefConsoleCommon", () => {

    it("should get response from default console.", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await CollectCommand.collectDefConsoleCommon(PRETEND_SESSION, COMMAND_RESPONSE_KEY);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expectZosmfResponseSucceeded(response, error);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_GET_RESOURCE);
    });
});

describe("CollectCommand collect", () => {

    it("should get response from custom console.", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_RESPONSE1);
                });
            });
        })
            .mockReturnValueOnce(FOLLOW_UP_RESPONSE2)
            .mockReturnValue(FOLLOW_UP_EMPTY);

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await CollectCommand.collect(PRETEND_SESSION, CMD_CUST_CONSOLE_COLLECT_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expectConsoleResponseSucceeded(response, error);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(2);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_CUSTOM_GET_RESOURCE);
    });

    it("should get response (one chunk of data provided as a response).", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_RESPONSE1);
                });
            });
        })
            .mockReturnValueOnce(FOLLOW_UP_RESPONSE2)
            .mockReturnValue(FOLLOW_UP_EMPTY);

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await CollectCommand.collect(PRETEND_SESSION, CMD_DEF_CONSOLE_COLLECT_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expectConsoleResponseSucceeded(response, error);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(2);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_GET_RESOURCE);
    });

    it("should get response (two chunks of data with empty responses provided as a response).", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_RESPONSE1);
                });
            });
        })
            .mockReturnValueOnce(FOLLOW_UP_EMPTY)
            .mockReturnValueOnce(FOLLOW_UP_RESPONSE1)
            .mockReturnValueOnce(FOLLOW_UP_EMPTY)
            .mockReturnValueOnce(FOLLOW_UP_EMPTY)
            .mockReturnValueOnce(FOLLOW_UP_RESPONSE2)
            .mockReturnValue(FOLLOW_UP_EMPTY);

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await CollectCommand.collect(PRETEND_SESSION, CMD_COLLECT_FOLLOWUP2_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expectConsoleResponseSucceeded(response, error);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(NUMBER_FOUR);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(NUMBER_FOUR);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_GET_RESOURCE);
    });

    it("should handle Imperative error.", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            throw new ImperativeError({msg: "Issue error message"}, {suppressReport: false, tag: "some tag"});
        })
            .mockReturnValueOnce(FOLLOW_UP_RESPONSE1);

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await CollectCommand.collect(PRETEND_SESSION, CMD_DEF_CONSOLE_COLLECT_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(response.success).toBeFalsy();
        expect(response.failureResponse).toBeDefined();
        expect(response.zosmfResponse.length).toBe(1);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(2);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_GET_RESOURCE);
    });

    it("with non empty console response should collect all data.", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((reject) => {
                process.nextTick(() => {
                    reject(FOLLOW_UP_RESPONSE1);
                });
            });
        })
            .mockReturnValueOnce(FOLLOW_UP_RESPONSE1)
            .mockReturnValue(FOLLOW_UP_EMPTY);

        const response: IConsoleResponse = await CollectCommand.collect(PRETEND_SESSION, CMD_DEF_CONSOLE_COLLECT_PARMS,
            FOLLOW_UP_CONSOLE_RESPONSE);

        expect(response).toBeDefined();
        expect(response.success).toBeTruthy();
        expect(response.zosmfResponse.length).toBe(NUMBER_THREE);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledTimes(2);
        expect((ZosmfRestClient.getExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_GET_RESOURCE);
    });

});
