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

import { AbstractSession, TextUtils, ImperativeExpect, ImperativeError } from "@zowe/imperative";
import { noSession } from "@zowe/core-for-zowe-sdk";

/**
 * Class validates parameters for workflows commands.
 * @export
 * @class WorkflowValidator
 */
export class WorkflowValidator {

    /**
     * Validate session
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @memberof WorkflowValidator
     */
    public static validateSession(session: AbstractSession) {
        ImperativeExpect.toNotBeNullOrUndefined(session,
            TextUtils.formatMessage(noSession.message));
    }


    /**
     * Validate supplied parameters
     * @static
     * @param {string} text - string to check if not null or undefined
     * @param {string} errorMsg - message to show in case validation fails
     * @memberof WorkflowValidator
     */
    public static validateString(text: string, errorMsg: string) {
        ImperativeExpect.toNotBeNullOrUndefined(text, errorMsg);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {string} text - string to check if empty
     * @param {string} errorMsg - message to show in case validation fails
     * @memberof WorkflowValidator
     */
    public static validateNotEmptyString(text: string, errorMsg: string) {
        ImperativeExpect.toNotBeEqual("", text, errorMsg);
        WorkflowValidator.validateString(text, errorMsg);
    }

    /**
     * Validate supplied string for parameters if there is not value "?" or "&"
     * @static
     * @param {string} parameterValue - check if the provided parameters does not contain value "?" or "&"
     * @param {string} errorMsg - message to show in case validation fails
     * @memberof WorkflowValidator
     */
    public static validateParameter(parameterValue: string, errorMsg: string) {
        const result: boolean = /^[^+?&]+$/.test(parameterValue);
        if(!result){
            throw new ImperativeError({msg : errorMsg});
        }
    }

    /**
     * Validate supplied parameter
     * @static
     * @param {string} userID - string to check if it is valid user ID regarding IBM
     * @param {string} errorMsg - message to show in case validation fails
     * @memberof WorkflowValidator
     */
    public static validateOwner(userID: string, errorMsg: string) {
        const result = new RegExp(/^[a-zA-Z0-9#\$@]{1,8}$/).test(userID);
        ImperativeExpect.toBeEqual(true, result, errorMsg);
    }
}
