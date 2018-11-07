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

import { apiErrorHeader, IMessageDefinition } from "@brightside/imperative";

export class ConsoleConstants {
    public static readonly CLASS: string = "Consoles";
    public static readonly RESOURCE: string = "/zosmf/restconsoles/consoles";
    public static readonly RES_DEF_CN: string = "defcn";
    public static readonly SOL_MSGS: string = "/solmsgs";

    public static readonly DEFAULT_FOLLOWUP_ATTEMPTS: number = 1;
    public static readonly DEFAULT_TIMEOUT: number = 0;
}

export const displayResponse: IMessageDefinition = {
    message: `Populating console response: {{data}}`
};
export const displayError: IMessageDefinition = {
    message: apiErrorHeader + ` Populating console error: {{data}}`
};
export const displayCollectResponse: IMessageDefinition = {
    message: `Collect response: {{data}}`
};
export const displayCollectError: IMessageDefinition = {
    message: apiErrorHeader + ` Collect error: {{data}}`
};
export const decreaseCounter: IMessageDefinition = {
    message: `Decreasing follow up counter`
};
export const resetCounter: IMessageDefinition = {
    message: `Reset follow up counter`
};
export const noSession: IMessageDefinition = {
    message: apiErrorHeader + `No session was supplied.`
};
export const noZosmfInput: IMessageDefinition = {
    message: apiErrorHeader + `No zosmf console input parameters were supplied.`
};
export const noConsoleInput: IMessageDefinition = {
    message: apiErrorHeader + `No console issue parameters were supplied.`
};
export const noConsoleName: IMessageDefinition = {
    message: apiErrorHeader + `No console name was supplied.`
};
export const noCommandKey: IMessageDefinition = {
    message: apiErrorHeader + `No command response key was supplied.`
};
export const noCollectParameters: IMessageDefinition = {
    message: apiErrorHeader + `No console collect parameters were supplied.`
};
export const collectProcessingDetails: IMessageDefinition = {
    message: `Collect processing - timeout: {{timer}}, followUpCounter: {{counter}}`
};
