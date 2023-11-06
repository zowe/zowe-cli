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

import {
    CollectCommand,
    ConsoleConstants,
    ICollectParms,
    IConsoleResponse,
    IIssueParms,
    IssueCommand,
    IZosmfIssueParms,
    IZosmfIssueResponse
} from "../../src";
import { ZosmfRestClient, noSession } from "@zowe/core-for-zowe-sdk";
import { Headers, Imperative, ImperativeError, Session } from "@zowe/core-for-zowe-sdk";
import { inspect } from "util";
import { noConsoleInput, noConsoleName, noZosmfInput } from "../../src/ConsoleConstants";

const PRETEND_SESSION = new Session({
    user: "user",
    password: "password",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const COMMAND_NAME: string = "cmd";
const SOL_KEY_NAME: string = "sol-key";
const SYSTEM_NAME: string = "system";

const COMMAND_RESPONSE_KEY: string = "C1046283";
const COMMAND: string = "D IPLINFO";

const ISSUE_HEADERS: any[] = [Headers.APPLICATION_JSON];
const CUSTOM_CONSOLE: string = "custcons";
const EXPECTED_CUSTOM_PUT_RESOURCE: string = IssueCommand.getResource(CUSTOM_CONSOLE);

const IMPERATIVE_ERROR_RESPONSE: ImperativeError = new ImperativeError({msg: "Test error message"},
    {tag: "some tag"});

const CMD_ZOSMF_PARMS: IZosmfIssueParms = {
    cmd: COMMAND_NAME
};

const CMD_DEF_CONSOLE_PARMS: IIssueParms = {
    command: COMMAND_NAME
};

const CMD_CUSTOM_CONSOLE_PARMS: IIssueParms = {
    command: COMMAND_NAME,
    consoleName: CUSTOM_CONSOLE
};

const FOLLOW_UP_2_PARAMS: ICollectParms = {
    commandResponseKey: COMMAND_RESPONSE_KEY,
    followUpAttempts: 2
};

const FOLLOW_UP_CONSOLE_RESPONSE: IConsoleResponse = {
    success: true,
    zosmfResponse: [],
    commandResponse: "cmdResponse",
    lastResponseKey: "C123456789"
};

const FOLLOW_UP_CONSOLE_SOLICITED_RESPONSE: IConsoleResponse = {
    success: true,
    zosmfResponse: [],
    commandResponse: "cmdResponse",
    lastResponseKey: "C123456789",
    keywordDetected: true
};

const FOLLOW_UP_CONSOLE_NO_KEY_RESPONSE: IConsoleResponse = {
    success: true,
    zosmfResponse: [],
    commandResponse: "cmdResponse",
    lastResponseKey: ""
};

const CMD_RESPONSE: IZosmfIssueResponse = {
    "cmd-response-key": COMMAND_RESPONSE_KEY,
    "cmd-response-url": "https://host.com:443/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response-uri": "/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response": " IEE254I  09.00.16 IPLINFO DISPLAY 147\r  SYSTEM IPLED AT 14.36.04 ON 02/17/2018\r  RELEASE z/OS 02.03.00    " +
    "LICENSE = z/OS\r  USED LOAD23 IN SYS1.IPLPARM ON 00351\r  ARCHLVL = 2   MTLSHARE = N\r  IEASYM LIST = 00\r  IEASYS LIST = (00) (OP)\r  " +
    "IODF DEVICE: ORIGINAL(00351) CURRENT(00351)\r  IPL DEVICE: ORIGINAL(0AE18) CURRENT(0AE18) VOLUME(BSTR04)"
};

const CMD_KEYWORD_RESPONSE: IZosmfIssueResponse = {
    "cmd-response-key": COMMAND_RESPONSE_KEY,
    "cmd-response-url": "https://host.com:443/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response-uri": "/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response": " IEE254I  09.00.16 IPLINFO DISPLAY 147\r  SYSTEM IPLED AT 14.36.04 ON 02/17/2018\r  RELEASE z/OS 02.03.00    " +
    "LICENSE = z/OS\r  USED LOAD23 IN SYS1.IPLPARM ON 00351\r  ARCHLVL = 2   MTLSHARE = N\r  IEASYM LIST = 00\r  IEASYS LIST = (00) (OP)\r  " +
    "IODF DEVICE: ORIGINAL(00351) CURRENT(00351)\r  IPL DEVICE: ORIGINAL(0AE18) CURRENT(0AE18) VOLUME(BSTR04)",
    "sol-key-detected": true
};

function expectZosmfResponseSucceeded(response: IZosmfIssueResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IZosmfIssueResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

function expectConsoleResponseSucceeded(response: IConsoleResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
    expect(response.success).toBeTruthy();
}

function expectConsoleResponseFailed(response: IConsoleResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}


describe("IssueCommand buildZosmfConsoleApiParameters", () => {

    it("returns correct IZosmfIssueParms object with cmd field.", () => {

        const parameters: IIssueParms = {
            command: COMMAND
        };

        const zosmfParams: IZosmfIssueParms = IssueCommand.buildZosmfConsoleApiParameters(parameters);

        expect(zosmfParams).toBeDefined();
        expect(zosmfParams.cmd).toEqual(COMMAND);
    });

    it("returns correct IZosmfIssueParms object with all fields.", () => {
        const expectedkeyword = "solicited";
        const expectedSystem = "***REMOVED***";

        const parameters: IIssueParms = {
            command: COMMAND,
            solicitedKeyword: expectedkeyword,
            sysplexSystem: expectedSystem
        };

        const zosmfParams: IZosmfIssueParms = IssueCommand.buildZosmfConsoleApiParameters(parameters);

        expect(zosmfParams).toBeDefined();
        expect((zosmfParams as any)[COMMAND_NAME]).toEqual(COMMAND);
        expect((zosmfParams as any)[SOL_KEY_NAME]).toEqual(expectedkeyword);
        expect((zosmfParams as any)[SYSTEM_NAME]).toEqual(expectedSystem);
    });

    it("should return error if parameter is undefined.", () => {
        let error;
        try {
            IssueCommand.buildZosmfConsoleApiParameters(undefined);
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error).toBeDefined();
    });
});

describe("IssueCommand issueCommon", () => {

    it("with correct parameters should succeed.", async () => {
        (ZosmfRestClient.putExpectJSON as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await IssueCommand.issueCommon(PRETEND_SESSION, CUSTOM_CONSOLE, CMD_ZOSMF_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect((ZosmfRestClient.putExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.putExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_CUSTOM_PUT_RESOURCE,
            ISSUE_HEADERS, CMD_ZOSMF_PARMS);
    });

    it("with undefined session should return error message.", async () => {
        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await IssueCommand.issueCommon(undefined, ConsoleConstants.RES_DEF_CN, CMD_ZOSMF_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expectZosmfResponseFailed(response, error, noSession.message);
    });

    it("with undefined console name should return error message.", async () => {
        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await IssueCommand.issueCommon(PRETEND_SESSION, undefined, CMD_ZOSMF_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }
        expectZosmfResponseFailed(response, error, noConsoleName.message);
    });

    it("with undefined zosmf command parameters should return error message.", async () => {
        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await IssueCommand.issueCommon(PRETEND_SESSION, ConsoleConstants.RES_DEF_CN, undefined);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }
        expectZosmfResponseFailed(response, error, noZosmfInput.message);
    });

    it("should handle Imperative error.", async () => {
        (ZosmfRestClient.putExpectJSON as any) = jest.fn(() => {
            throw new ImperativeError({msg: "Issue error message"}, {tag: "some tag"});
        });

        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await IssueCommand.issueCommon(PRETEND_SESSION, CUSTOM_CONSOLE, CMD_ZOSMF_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }
        expectZosmfResponseFailed(response, error, "Issue error message");
        expect(ZosmfRestClient.putExpectJSON as any).toHaveBeenCalledTimes(1);
    });
});

describe("IssueCommand issueDefConsoleCommon", () => {

    it("with correct parameters should succeed.", async () => {
        (IssueCommand.issueCommon as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IZosmfIssueResponse;
        try {
            response = await IssueCommand.issueDefConsoleCommon(PRETEND_SESSION, CMD_ZOSMF_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expectZosmfResponseSucceeded(response, error);
    });

});

describe("IssueCommand issue", () => {

    it("with undefined console command parameters should fail.", async () => {
        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issue(PRETEND_SESSION, undefined);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }
        expectConsoleResponseFailed(response, error, noConsoleInput.message);
    });


    it("with correct parameters should succeed.", async () => {
        (IssueCommand.issueCommon as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issue(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issueCommon as any).toHaveBeenCalledTimes(1);
        expect(IssueCommand.issueCommon as any).toHaveBeenCalledWith(PRETEND_SESSION, ConsoleConstants.RES_DEF_CN, CMD_ZOSMF_PARMS);
        expectConsoleResponseSucceeded(response, error);
        expect(response.zosmfResponse.length).toBe(1);
    });

    it("with default console name should succeed.", async () => {
        (IssueCommand.issueCommon as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issue(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issueCommon as any).toHaveBeenCalledTimes(1);
        expect(IssueCommand.issueCommon as any).toHaveBeenCalledWith(PRETEND_SESSION, ConsoleConstants.RES_DEF_CN, CMD_ZOSMF_PARMS);
    });

    it("with custom console name should succeed.", async () => {
        (IssueCommand.issueCommon as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issue(PRETEND_SESSION, CMD_CUSTOM_CONSOLE_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issueCommon as any).toHaveBeenCalledTimes(1);
        expect(IssueCommand.issueCommon as any).toHaveBeenCalledWith(PRETEND_SESSION, CUSTOM_CONSOLE, CMD_ZOSMF_PARMS);
    });

    it("with keyword should succeed.", async () => {
        (IssueCommand.issueCommon as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_KEYWORD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issue(PRETEND_SESSION, CMD_CUSTOM_CONSOLE_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issueCommon as any).toHaveBeenCalledTimes(1);
        expect(IssueCommand.issueCommon as any).toHaveBeenCalledWith(PRETEND_SESSION, CUSTOM_CONSOLE, CMD_ZOSMF_PARMS);
    });

    it("should handle Imperative error.", async () => {
        (IssueCommand.issueCommon as any) = jest.fn(() => {
            throw new ImperativeError({msg: "Test error message"}, {tag: "some tag"});
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issue(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issueCommon as any).toHaveBeenCalledTimes(1);
        expectConsoleResponseFailed(response, error, "Test error message");
    });
});

describe("IssueCommand issueSimple", () => {

    it("with correct parameters should succeed.", async () => {
        (IssueCommand.issueCommon as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(CMD_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issueSimple(PRETEND_SESSION, COMMAND_NAME);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issueCommon as any).toHaveBeenCalledTimes(1);
        expect(IssueCommand.issueCommon as any).toHaveBeenCalledWith(PRETEND_SESSION, ConsoleConstants.RES_DEF_CN, CMD_ZOSMF_PARMS);
        expectConsoleResponseSucceeded(response, error);
    });

});

describe("IssueCommand issueAndCollect", () => {

    it("should succeed.", async () => {
        (IssueCommand.issue as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_CONSOLE_RESPONSE);
                });
            });
        });

        (CollectCommand.collect as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_CONSOLE_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issueAndCollect(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS, FOLLOW_UP_2_PARAMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issue as any).toHaveBeenCalledTimes(1);
        expect(IssueCommand.issue as any).toHaveBeenCalledWith(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS);

        expect(CollectCommand.collect as any).toHaveBeenCalledTimes(1);
        expect(CollectCommand.collect as any).toHaveBeenCalledWith(PRETEND_SESSION, FOLLOW_UP_2_PARAMS, FOLLOW_UP_CONSOLE_RESPONSE);

        expectConsoleResponseSucceeded(response, error);
    });

    it("should not call collect method if response key from issue is empty.", async () => {
        (IssueCommand.issue as any) = jest.fn((): Promise<IConsoleResponse> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_CONSOLE_NO_KEY_RESPONSE);
                });
            });
        });

        (CollectCommand.collect as any) = jest.fn((): Promise<IConsoleResponse> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_CONSOLE_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issueAndCollect(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS, FOLLOW_UP_2_PARAMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issue as any).toHaveBeenCalledTimes(1);
        expect(IssueCommand.issue as any).toHaveBeenCalledWith(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS);
        expect(CollectCommand.collect as any).toHaveBeenCalledTimes(0);
    });

    it("should not call collect if keyword was detected after issue.", async () => {
        (IssueCommand.issue as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_CONSOLE_SOLICITED_RESPONSE);
                });
            });
        });

        (CollectCommand.collect as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_CONSOLE_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issueAndCollect(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS, FOLLOW_UP_2_PARAMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issue as any).toHaveBeenCalledTimes(1);
        expect(IssueCommand.issue as any).toHaveBeenCalledWith(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS);
        expect(CollectCommand.collect as any).toHaveBeenCalledTimes(0);
    });

    it("should not call collect if issue call returns Imperative error.", async () => {
        (IssueCommand.issue as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(IMPERATIVE_ERROR_RESPONSE);
                });
            });
        });

        (CollectCommand.collect as any) = jest.fn(() => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(FOLLOW_UP_CONSOLE_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IConsoleResponse;
        try {
            response = await IssueCommand.issueAndCollect(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS, FOLLOW_UP_2_PARAMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error " + inspect(error));
        }

        expect(IssueCommand.issue as any).toHaveBeenCalledTimes(1);
        expect(IssueCommand.issue as any).toHaveBeenCalledWith(PRETEND_SESSION, CMD_DEF_CONSOLE_PARMS);
        expect(CollectCommand.collect as any).toHaveBeenCalledTimes(0);
    });

});
