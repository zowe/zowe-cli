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

import { apiErrorHeader, IMessageDefinition } from "@zowe/imperative";

export class ZosLogConstants {
    public static readonly RESOURCE: string = "/zosmf/restconsoles/v1/log?";
}

/**
 * Error message that no session provided.
 * @static
 * @type {IMessageDefinition}
 * @memberof ZosLogConstants
 */
export const noSessionMessage: IMessageDefinition = {
    message: apiErrorHeader.message + ` No session was supplied.`
};
