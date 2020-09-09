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

import { ICollectParms, IIssueParms } from "../src/";
import { IZosmfIssueParms } from "../src/doc/zosmf/IZosmfIssueParms";
import { AbstractSession, ImperativeExpect, TextUtils } from "@zowe/imperative";
import { noCollectParameters, noCommandKey, noConsoleInput, noConsoleName, noSession, noZosmfInput } from "./ConsoleConstants";

/**
 * Class validates parameters for console commands
 * @export
 * @class ConsoleValidator
 */
export class ConsoleValidator {
    /**
     * Validate supplied parameters
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {string} consoleName name of the EMCS console that is used to issue the command
     * @param {IZosmfIssueParms} commandParms synchronous console issue parameters, @see {IZosmfIssueParms}
     * @memberof
     */
    public static validateCommonParms(session: AbstractSession, consoleName: string, commandParms: IZosmfIssueParms) {
        this.validateSession(session);
        this.validateConsoleName(consoleName);
        ImperativeExpect.toNotBeNullOrUndefined(commandParms, noZosmfInput.message);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {IIssueParms} parms console issue parameters, @see {IIssueParms}
     * @memberof ConsoleValidator
     */
    public static validateIssueParms(session: AbstractSession, parms: IIssueParms) {
        this.validateSession(session);
        this.validateIssueParm(parms);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {string} theCommand command to issue
     * @memberof ConsoleValidator
     */
    public static validateIssueSimpleParms(session: AbstractSession, theCommand: string) {
        this.validateSession(session);
        ImperativeExpect.toNotBeNullOrUndefined(theCommand, noConsoleInput.message);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {ICollectParms} parms console collect parameters, @see {ICollectParms}
     * @memberof ConsoleValidator
     */
    public static validateCollectParm(parms: ICollectParms) {
        ImperativeExpect.toNotBeNullOrUndefined(parms, noCollectParameters.message);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {IIssueParms} parms console issue parameters, @see {IIssueParms}
     * @memberof ConsoleValidator
     */
    public static validateIssueParm(parms: IIssueParms) {
        ImperativeExpect.toNotBeNullOrUndefined(parms, noConsoleInput.message);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {string} consoleName name of the EMCS console that is used to issue the command
     * @param {string} commandResponseKey command response key from the Issue Command request
     * @memberof ConsoleValidator
     */
    public static validateCollectCommonParms(session: AbstractSession, consoleName: string, commandResponseKey: string) {
        this.validateSession(session);
        this.validateConsoleName(consoleName);
        ImperativeExpect.toNotBeNullOrUndefined(commandResponseKey, noCommandKey.message);
    }

    /**
     * Validate supplied parameters
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {ICollectParms} parms console collect parameters, @see {ICollectParms}
     * @memberof ConsoleValidator
     */
    public static validateCollectParms(session: AbstractSession, parms: ICollectParms) {
        this.validateSession(session);
        this.validateCollectParm(parms);
    }

    /**
     * Validate session
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @memberof ConsoleValidator
     */
    private static validateSession(session: AbstractSession) {
        ImperativeExpect.toNotBeNullOrUndefined(session,
            TextUtils.formatMessage(noSession.message));
    }

    /**
     * Validate console name
     * @static
     * @param {string} consoleName
     * @memberof ConsoleValidator
     */
    private static validateConsoleName(consoleName: string) {
        ImperativeExpect.toNotBeNullOrUndefined(consoleName, noConsoleName.message);
    }
}
