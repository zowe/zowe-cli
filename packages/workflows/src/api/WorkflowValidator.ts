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

import { AbstractSession, TextUtils, ImperativeExpect } from "@brightside/imperative";
import { noSession } from "./WorkflowConstants";

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
     * Validate supplied parameter
     * @static
     * @param {string} path - string to check if contains USS path or DSNAME
     * @param {string} errorMsg - message to show in case validation fails
     * @memberof WorkflowValidator
     * TODO maybe also validation if the file or DSNAME exists on Mainframe
     */
    public static validatePath(path: string, errorMsg: string) {
        const DSN = /^[A-Z#$@][A-Z0-9#$@-]{0,7}([.][A-Z#$@][A-Z0-9#$@-]{0,7}){0,21}$/;
        const MEMBER = /^\([A-Z#$@]{1}[A-Z0-9#$@-]{0,7}\)$/;
        const USS = /^\/.*$/;
        const memberLen = 44;

        if (path.search(/\(/) >= 0) {
            // if there is '(' in path it is not USS path nor DSNAME, so check if it is DSNAME incl. member
            const member = path.slice(path.search(/\(/));
            const dsname = path.slice(0, path.search(/\(/));
            const resultDSN = new RegExp(DSN).test(dsname);
            const result44 = dsname.length <= memberLen;
            const resultMemeber = new RegExp(MEMBER).test(member);
            const result = resultDSN && result44 && resultMemeber;
            ImperativeExpect.toBeEqual(true, result, errorMsg);
        } else if (path.search(/\//) >= 0) {
            // if there is '/' it can be only USS path
            const result = new RegExp(USS).test(path);
            ImperativeExpect.toBeEqual(true, result, errorMsg);
        } else {
            // last check is for DSNAME only.
            const resultDSN = new RegExp(DSN).test(path);
            const result44 = path.length <= memberLen;
            const result = resultDSN && result44;
            ImperativeExpect.toBeEqual(true, result, errorMsg);
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
     /**
     * Validate supplied string
     * @static
     * @param {string} parameterValue - string to check if it does not contain value ? or &
     * @param {string} errorMsg - message to show in case validation fails
     * @memberof WorkflowValidator
     */
    public static validateParameter(parameterValue: string, errorMsg: string) {
        const result = new RegExp(/^[a-zA-Z0-9]$/).test(parameterValue);
        ImperativeExpect.toBeEqual(true, result, errorMsg);
    }
}
