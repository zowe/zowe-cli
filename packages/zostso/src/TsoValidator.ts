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

import { AbstractSession, ImperativeExpect, TextUtils } from "@zowe/imperative";
import { noSessionTso, noTsoIssueInput, noTsoStartInput, noTsoStopInput, noZosmfResponse } from "./TsoConstants";
import { IStartTsoParms } from "./doc/input/IStartTsoParms";
import { IStopTsoParms } from "./doc/input/IStopTsoParms";
import { IIssueTsoParms } from "./doc/input/IIssueTsoParms";
import { IZosmfPingResponse } from "./doc/zosmf/IZosmfPingResponse";
import { IZosmfTsoResponse } from "./doc/zosmf/IZosmfTsoResponse";


/**
 * Class validates parameters for TSO commands
 * @export
 * @class TsoValidator
 */
export class TsoValidator {

    /**
     * Validate session
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @memberOf TsoValidator
     */
    public static validateSession(session: AbstractSession) {
        ImperativeExpect.toNotBeNullOrUndefined(session,
            TextUtils.formatMessage(noSessionTso.message));
    }

    /**
     * Validate TSO start command parameters
     * @param {IStartTsoParms} parms - object with required parameters, @see {IStartTsoParms}
     * @memberOf TsoValidator
     */
    public static validateStartParams(parms: IStartTsoParms) {
        ImperativeExpect.toNotBeNullOrUndefined(parms, noTsoStartInput.message);
    }

    /**
     * Validate TSO issue command parameters
     * @param {IStartTsoParms} parms - object with required parameters, @see {IIssueTsoParms}
     * @memberOf TsoValidator
     */
    public static validateIssueParams(parms: IIssueTsoParms) {
        ImperativeExpect.toNotBeNullOrUndefined(parms, noTsoIssueInput.message);
    }

    /**
     * Validate TSO stop command parameters
     * @param {IStopTsoParms} parms - object with required parameters, @see {IStopTsoParms}
     * @memberOf TsoValidator
     */
    public static validateStopParams(parms: IStopTsoParms) {
        ImperativeExpect.toNotBeNullOrUndefined(parms, noTsoStopInput.message);
    }

    /**
     * Validate z/OSMF response, needed for service and filtering servlet key
     * @param {IZosmfTsoResponse} parms - object response from z/OSMF, @see {IZosmfTsoResponse}
     * @memberOf TsoValidator
     */
    public static validateStartZosmfResponse(parms: IZosmfTsoResponse) {
        ImperativeExpect.toNotBeNullOrUndefined(parms, noZosmfResponse.message);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {AbstractSession} session - representing connection to this api
     * @param {string} text - string to check if not empty or undefined
     * @param {string} errorMsg - message to show in text case validation fails
     * @memberof TsoValidator
     */
    public static validatePingParms(session: AbstractSession, text: string, errorMsg: string) {
        this.validateSession(session);
        this.validateNotEmptyString(text, errorMsg);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {string} text - string to check if not null or undefined
     * @param {string} errorMsg - message to show in text case validation fails
     * @memberof TsoValidator
     */
    public static validateString(text: string, errorMsg: string) {
        ImperativeExpect.toNotBeNullOrUndefined(text, errorMsg);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {string} text - string to check if empty
     * @param {string} errorMsg - message to show in text case validation fails
     * @memberof TsoValidator
     */
    public static validateNotEmptyString(text: string, errorMsg: string) {
        ImperativeExpect.toNotBeEqual("", text, errorMsg);
        TsoValidator.validateString(text, errorMsg);
    }

    /**
     * Validate z/OSMF response
     * @param {IZosmfPingResponse} parms - object response from z/OSMF, @see {IZosmfPingResponse}
     * @memberOf TsoValidator
     */
    public static validatePingZosmfResponse(parms: IZosmfPingResponse) {
        ImperativeExpect.toNotBeNullOrUndefined(parms, noZosmfResponse.message);
    }

    /**
     * Validate z/OSMF response for errors
     * @param {IZosmfTsoResponse} zosmfResponse - object response from z/OSMF, @see {IZosmfTsoResponse}
     * @memberOf TsoValidator
     */
    public static validateErrorMessageFromZosmf(zosmfResponse: IZosmfTsoResponse) {
        if (zosmfResponse.msgData) {
            ImperativeExpect.toBeEqual(zosmfResponse.msgData, "undefined", zosmfResponse.msgData[0].messageText);
        }
    }

}

