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

import { IMessageDefinition } from "../messages/doc/IMessageDefinition";
import { apiErrorHeader } from "../messages/CoreMessages";

/**
 * Error message that no z/OSMF version parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof CommonConstants
 */
export const nozOSMFVersion: IMessageDefinition = {
    message: apiErrorHeader.message + ` No z/OSMF version parameter was supplied.`
};


/**
 * Error message that no session was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof CommonConstants
 */
export const noSession: IMessageDefinition = {
    message: apiErrorHeader.message + ` No session was supplied.`
};
