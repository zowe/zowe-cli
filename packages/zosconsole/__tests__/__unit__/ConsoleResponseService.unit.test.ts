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

import { ConsoleResponseService, IConsoleResponse, IZosmfIssueResponse } from "../../src";

const COMMAND_RESPONSE_KEY: string = "C1046283";
const COMMAND_RESPONSE: string = "text part 1 text part two text part three";
const COMMAND_RESPONSE_URL: string = "https://host.com:443/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY;

const ZOSMF_CONSOLE_NO_SOLKEY_RESPONSE: IZosmfIssueResponse = {
    "cmd-response-key": COMMAND_RESPONSE_KEY,
    "cmd-response-url": COMMAND_RESPONSE_URL,
    "cmd-response-uri": "/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response": COMMAND_RESPONSE
};
const ZOSMF_CONSOLE_RESPONSE: IZosmfIssueResponse = {
    "cmd-response-key": COMMAND_RESPONSE_KEY,
    "cmd-response-url": COMMAND_RESPONSE_URL,
    "cmd-response-uri": "/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response": COMMAND_RESPONSE

};
const ZOSMF_EMPTY_RESPONSE: IZosmfIssueResponse = {
    "cmd-response-key": COMMAND_RESPONSE_KEY,
    "cmd-response-url": COMMAND_RESPONSE_URL,
    "cmd-response-uri": "/zosmf/restconsoles/consoles/defcn/solmsgs/" + COMMAND_RESPONSE_KEY,
    "cmd-response": "",
    "sol-key-detected": true
};

const CONSOLE_RESPONSE: IConsoleResponse = {
    success: true,
    zosmfResponse: [ZOSMF_CONSOLE_RESPONSE],
    commandResponse: COMMAND_RESPONSE + "\n",
    lastResponseKey: COMMAND_RESPONSE_KEY,
    cmdResponseUrl: COMMAND_RESPONSE_URL
};

const CONSOLE_NO_SOLKEY_RESPONSE: IConsoleResponse = {
    success: true,
    zosmfResponse: [ZOSMF_CONSOLE_RESPONSE, ZOSMF_CONSOLE_NO_SOLKEY_RESPONSE],
    commandResponse: COMMAND_RESPONSE + "\n" + COMMAND_RESPONSE + "\n",
    lastResponseKey: COMMAND_RESPONSE_KEY,
    cmdResponseUrl: COMMAND_RESPONSE_URL
};

const CONSOLE_RESPONSE_LAST_EMPTY: IConsoleResponse = {
    success: true,
    zosmfResponse: [ZOSMF_CONSOLE_RESPONSE, ZOSMF_EMPTY_RESPONSE],
    commandResponse: COMMAND_RESPONSE + "\n",
    lastResponseKey: COMMAND_RESPONSE_KEY,
    keywordDetected: true,
    cmdResponseUrl: COMMAND_RESPONSE_URL
};
const CONSOLE_RESPONSE_LAST_NOT_EMPTY: IConsoleResponse = {
    success: true,
    zosmfResponse: [ZOSMF_EMPTY_RESPONSE, ZOSMF_CONSOLE_RESPONSE],
    commandResponse: COMMAND_RESPONSE + "\n",
    lastResponseKey: COMMAND_RESPONSE_KEY,
    keywordDetected: true,
    cmdResponseUrl: COMMAND_RESPONSE_URL
};

const CONSOLE_RESPONSE_EMPTY: IConsoleResponse = {
    success: true,
    zosmfResponse: [ZOSMF_EMPTY_RESPONSE],
    commandResponse: "",
    lastResponseKey: COMMAND_RESPONSE_KEY,
    keywordDetected: true,
    cmdResponseUrl: COMMAND_RESPONSE_URL
};

describe("ConsoleResponseService isLastZosmfResponseEmpty", () => {

    it("should return FALSE if console response is not empty.", () => {
        const result: boolean = ConsoleResponseService.isLastZosmfResponseEmpty(CONSOLE_RESPONSE);
        expect(result).toBeFalsy();
    });

    it("should return TRUE if console response is undefined.", () => {
        const result: boolean = ConsoleResponseService.isLastZosmfResponseEmpty(undefined);
        expect(result).toBeTruthy();
    });

    it("should return FALSE if console response is empty.", () => {
        const result: boolean = ConsoleResponseService.isLastZosmfResponseEmpty(ConsoleResponseService.getEmptyConsoleResponse());
        expect(result).toBeTruthy();
    });

    it("should return TRUE if console response has few zosmf responses AND last zosmf response is not empty.", () => {
        const result: boolean = ConsoleResponseService.isLastZosmfResponseEmpty(CONSOLE_RESPONSE_LAST_EMPTY);
        expect(result).toBeTruthy();
    });

    it("should return FALSE if console response has few zosmf responses AND last zosmf response is empty.", () => {
        const result: boolean = ConsoleResponseService.isLastZosmfResponseEmpty(CONSOLE_RESPONSE_LAST_NOT_EMPTY);
        expect(result).toBeFalsy();
    });
});

describe("ConsoleResponseService populate", () => {
    it("should populate empty console response with additional data.", () => {
        const response: IConsoleResponse =
            ConsoleResponseService.populate(ZOSMF_CONSOLE_RESPONSE, ConsoleResponseService.getEmptyConsoleResponse());
        expect(response).toEqual(CONSOLE_RESPONSE);
    });

    it("should populate not empty console response with additional data.", () => {
        const response: IConsoleResponse =
            ConsoleResponseService.populate(ZOSMF_CONSOLE_NO_SOLKEY_RESPONSE, CONSOLE_RESPONSE);
        expect(response).toEqual(CONSOLE_NO_SOLKEY_RESPONSE);
    });

    it("should not process empty zosmf response .", () => {
        const response: IConsoleResponse =
            ConsoleResponseService.populate(ZOSMF_EMPTY_RESPONSE, ConsoleResponseService.getEmptyConsoleResponse());
        expect(response).toEqual(CONSOLE_RESPONSE_EMPTY);
    });

});
