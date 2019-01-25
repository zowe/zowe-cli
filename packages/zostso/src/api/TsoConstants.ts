/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { apiErrorHeader, IMessageDefinition } from "@brightside/imperative";


/**
 * Constants for TSO related info
 * @export
 * @class TsoConstants
 */
export class TsoConstants {
    /**
     * Quert id of logonProcedure passed to z/OSMF URI
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly PARM_PROC: string = "proc";

    /**
     * Quert id of character-set passed to z/OSMF URI
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly PARM_CHSET: string = "chset";

    /**
     * Quert id of code page passed to z/OSMF URI
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly PARM_CPAGE: string = "cpage";

    /**
     * Quert id of rows passed to z/OSMF URI
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly PARM_ROWS: string = "rows";

    /**
     * Quert id of columns passed to z/OSMF URI
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly PARM_COLS: string = "cols";

    /**
     * Quert id of account number passed to z/OSMF URI
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly PARM_ACCT: string = "acct";

    /**
     * Quert id of region size passed to z/OSMF URI
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly PARM_RSIZE: string = "rsize";

    /**
     * Default character-set value
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly DEFAULT_CHSET: string = "697";

    /**
     * Default code page value
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly DEFAULT_CPAGE: string = "1047";

    /**
     * Default number of rows value
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly DEFAULT_ROWS: string = "24";

    /**
     * Default number of columns value
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly DEFAULT_COLS: string = "80";

    /**
     * Default region-size value
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly DEFAULT_RSIZE: string = "4096";

    /**
     * Default logonProcedure value
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly DEFAULT_PROC: string = "IZUFPROC";

    /**
     * URI base for TSO API
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly RESOURCE: string = "/zosmf/tsoApp";

    /**
     * URI for starting TSO
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly RES_START_TSO: string = "tso";

    /**
     * Param for not reading reply
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly RES_DONT_READ_REPLY: string = "?readReply=false";

    /**
     * URI for TSO Ping API
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly RES_PING: string = TsoConstants.RESOURCE + "/" + TsoConstants.RES_START_TSO + "/ping";
    /**
     * Tso response message type - prompt
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly TSO_PROMPT = "TSO PROMPT";
    /**
     * Tso response message type - message
     * @static
     * @type {string}
     * @memberof TsoConstants
     */
    public static readonly TSO_MESSAGE = "TSO MESSAGE";

}

/**
 * No Session provided error message
 * @static
 * @type {IMessageDefinition}
 * @memberof TsoConstants
 */
export const noSessionTso: IMessageDefinition = {
    message: apiErrorHeader + `No session was supplied.`
};

/**
 * No input parameters were provided error message
 * @static
 * @type {IMessageDefinition}
 * @memberof TsoConstants
 */
export const noTsoStartInput: IMessageDefinition = {
    message: apiErrorHeader + `No tso start address space parameters were supplied.`
};

/**
 * No input parameters were provided error message
 * @static
 * @type {IMessageDefinition}
 * @memberof TsoConstants
 */
export const noTsoIssueInput: IMessageDefinition = {
    message: apiErrorHeader + `No tso issue command parameters were supplied.`
};

/**
 * No input parameters for stop were provided error message
 * @static
 * @type {IMessageDefinition}
 * @memberof TsoConstants
 */
export const noTsoStopInput: IMessageDefinition = {
    message: apiErrorHeader + `No tso stop address space parameters were supplied.`
};

/**
 * No ZOSMF response was received error message
 * @static
 * @type {IMessageDefinition}
 * @memberof TsoConstants
 */
export const noZosmfResponse: IMessageDefinition = {
    message: apiErrorHeader + `No z/OSMF response was received.`
};

/**
 * No servlet key was provided for Ping command error message
 * @static
 * @type {IMessageDefinition}
 * @memberof TsoConstants
 */
export const noPingInput: IMessageDefinition = {
    message: apiErrorHeader + `No servlet supplied.`
};

/**
 * No account number was provided error message
 * @static
 * @type {IMessageDefinition}
 * @memberof TsoConstants
 */
export const noAccountNumber: IMessageDefinition = {
    message: apiErrorHeader + `No account number was supplied.`
};

/**
 * No servlet key was provided error message
 * @static
 * @type {IMessageDefinition}
 * @memberOf TsoConstants
 */
export const noServletKeyInput: IMessageDefinition = {
    message: apiErrorHeader + `No servlet key was supplied.`
};

/**
 * No data parameter string was supplied error message
 * @static
 * @type {IMessageDefinition}
 * @memberof TsoConstants
 */
export const noDataInput: IMessageDefinition = {
    message: apiErrorHeader + `No data parameter string was supplied.`
};

/**
 * No command text was provided error message
 * @static
 * @type {IMessageDefinition}
 * @memberof TsoConstants
 */
export const noCommandInput: IMessageDefinition = {
    message: apiErrorHeader + `No command text was provided.`
};

