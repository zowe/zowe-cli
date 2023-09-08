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

import { COMMAND_RESPONSE_FORMAT } from "../api/processor/ICommandResponseApi";
import { ICommandDefinition } from "../../../..";
import { Arguments } from "yargs";
/**
 * Command response control parameters. Indicates how the command response should behave and allows influence over
 * colorings, etc.
 * @export
 * @interface ICommandResponseParms
 */
export interface ICommandResponseParms {
    /**
     * The arguments specified on the command line
     * @type {Arguments}
     * @memberof ICommandResponseParms
     */
    args?: Arguments;
    /**
     * The command definition for this response
     * @type {ICommandDefinition}
     * @memberof ICommandResponseParms
     */
    definition?: ICommandDefinition;
    /**
     * The primary text color used by Chalk package for highlighting messages.
     * @type {string}
     * @memberof ICommandResponseParms
     */
    primaryTextColor?: string;
    /**
     * Silent indicates that the command should produce absolutely no output to stdout/stderr (the console/terminal)
     * @type {boolean}
     * @memberof ICommandResponseParms
     */
    silent?: boolean;
    /**
     * The response format for the command. Controls how output is generated for the command (ignored if silent is
     * specified). See the type for more details.
     * @type {COMMAND_RESPONSE_FORMAT}
     * @memberof ICommandResponseParms
     */
    responseFormat?: COMMAND_RESPONSE_FORMAT;
    /**
     * The Progress bar spinner characters.
     * @type {string}
     * @memberof ICommandResponseParms
     */
    progressBarSpinner?: string;
}
