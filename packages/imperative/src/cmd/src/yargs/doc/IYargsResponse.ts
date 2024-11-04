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

import { ICommandResponse } from "../../doc/response/response/ICommandResponse";
/**
 * Indicates the action performed.
 */
export type ImperativeYargsCommandAction = "syntax validation" | "command handler invoked" | "help invoked";

/**
 * The Yargs response is provided on the callback for a command definition defined through the Zowe
 * Yargs definer - when an execution of that command is complete - this response will be given to the callback.
 */
export interface IYargsResponse {
    success: boolean;
    /**
     * Requested exit code for the process
     */
    exitCode: number;
    message: string;
    actionPerformed: ImperativeYargsCommandAction;
    commandResponses?: ICommandResponse[];
    causeErrors?: Error;
}
