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
 * Class validates parameters for provisioning commands.
 * @export
 * @class ProvisioningValidator
 */
export class WorkflowValidator {

    /**
     * Validate session
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @memberof ProvisioningValidator
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
     * @memberof ProvisioningValidator
     */
    public static validateString(text: string, errorMsg: string) {
        ImperativeExpect.toNotBeNullOrUndefined(text, errorMsg);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {string} text - string to check if empty
     * @param {string} errorMsg - message to show in case validation fails
     * @memberof ProvisioningValidator
     */
    public static validateNotEmptyString(text: string, errorMsg: string) {
        ImperativeExpect.toNotBeEqual("", text, errorMsg);
        WorkflowValidator.validateString(text, errorMsg);
    }
}
