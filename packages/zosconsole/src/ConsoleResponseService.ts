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

import { ImperativeError, Logger, TextUtils } from "@zowe/imperative";
import { inspect, isNullOrUndefined } from "util";
import { IZosmfIssueResponse } from "./doc/zosmf/IZosmfIssueResponse";
import { IConsoleResponse } from "./doc/IConsoleResponse";
import { displayError, displayResponse } from "./ConsoleConstants";

/**
 * Class contains helper methods for console response commands response processing
 * @export
 * @class ConsoleResponseService
 */
export class ConsoleResponseService {
    /**
     * Populate the console response with the details returned from the z/OSMF console API.
     * Method takes two parameters: response from z/OSMF command and response to be populated.
     * Method adds response to a collection of z/OSMF responses, mark response as "succeeded" (response.success = true)
     * and populate other fields of response with values from z/OSMF sresponse.
     * @static
     * @param {IZosmfIssueResponse} zosmfResponse zosmf console response, @see {IZosmfIssueResponse}
     * @param {IConsoleResponse} response console response to be populated, @see {IConsoleResponse}
     * @param {boolean} processResponses is set to true, append command response string to the console API response
     * @return {IConsoleResponse} populated console response, @see {IConsoleResponse}
     * @memberof ConsoleResponse
     */
    public static populate(zosmfResponse: IZosmfIssueResponse, response: IConsoleResponse,
                           processResponses?: boolean): IConsoleResponse {
        Logger.getImperativeLogger().trace(TextUtils.formatMessage(displayResponse.message, {data: inspect(zosmfResponse)}));
        Logger.getImperativeLogger().trace(TextUtils.formatMessage(displayResponse.message, {data: inspect(response)}));

        // Append the z/OSMF response - depending on the API request type, there may be more than 1 response -
        // caused by follow ups to obtain additional information.
        response.zosmfResponse = response.zosmfResponse.concat(zosmfResponse);
        response.success = true;

        // If this request specified a solicited keyword, indicate if the keyword was found in the console response.
        if (!isNullOrUndefined(zosmfResponse["sol-key-detected"])) {
            response.keywordDetected = zosmfResponse["sol-key-detected"];
        }

        // Append the command response string to the console response.
        if (!isNullOrUndefined(zosmfResponse["cmd-response"]) && zosmfResponse["cmd-response"].length > 0
            && (isNullOrUndefined(processResponses) || processResponses !== false)) {
            // the IBM responses sometimes have \r and sometimes \r\n, we will process them our here and hopefully
            // return them with just \n.
            response.commandResponse += zosmfResponse["cmd-response"].replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            // If there are messages append a line-break to ensure that additional messages collected are
            // displayed properly.
            if (response.commandResponse.length > 0
                && (response.commandResponse.indexOf("\n")
                    !== response.commandResponse.length - 1)) {
                response.commandResponse += "\n";
            }
        }

        // If the response key is present, set the last response key value in the response.
        if (!isNullOrUndefined(zosmfResponse["cmd-response-key"])) {
            response.lastResponseKey = zosmfResponse["cmd-response-key"];
        }

        // Collect the response url.
        if (!isNullOrUndefined(zosmfResponse["cmd-response-url"])) {
            response.cmdResponseUrl = zosmfResponse["cmd-response-url"];
        }

        return response;
    }

    /**
     * Populate the console response with the Imperative error message.
     * Method takes two parameters: Imperative error and response to be populated.
     * Method save error message info failureResponse field and mark console response as "failed" (response.success = false)
     * @tatic
     * @param {ImperativeError} error Imperative error, @see {ImperativeError}
     * @param {IConsoleResponse} response console response to be populated, @see {IConsoleResponse}
     * @return {IConsoleResponse} populated console response, @see {IConsoleResponse}
     * @memberof ConsoleResponse
     */
    public static populateError(error: ImperativeError, response: IConsoleResponse): IConsoleResponse {
        Logger.getImperativeLogger().trace(TextUtils.formatMessage(displayError.message, {data: inspect(error)}));

        // Append the z/OSMF response - depending on the API request type, there may be more than 1 response -
        // caused by follow ups to obtain additional information.
        response.failureResponse = error;
        response.success = false;

        return response;
    }

    /**
     * Provides empty console response
     * @static
     * @return {IConsoleResponse}
     * @memberof ConsoleResponse
     */
    public static getEmptyConsoleResponse(): IConsoleResponse {
        return {
            success: true,
            zosmfResponse: [],
            commandResponse: ""
        };
    }

    /**
     * Determines whether last z/OSMF response has empty content or not
     * @static
     * @param {IConsoleResponse} response command response
     * @return {boolean} true if last z/OSMF response has empty "cmd-response", false otherwise
     * @memberof ConsoleResponse
     */
    public static isLastZosmfResponseEmpty(response: IConsoleResponse): boolean {
        let result: boolean = true;
        if (!isNullOrUndefined(response) && response.zosmfResponse.length > 0) {
            const lastResponse: IZosmfIssueResponse = response.zosmfResponse[response.zosmfResponse.length - 1];
            result = isNullOrUndefined(lastResponse["cmd-response"]) || lastResponse["cmd-response"] === "";
        }
        return result;
    }
}
