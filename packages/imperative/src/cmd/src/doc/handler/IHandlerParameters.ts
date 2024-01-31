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

import * as stream from "stream";
import { ICommandDefinition } from "../ICommandDefinition";
import { CommandProfiles } from "../../profiles/CommandProfiles";
import { IHandlerResponseApi } from "../../doc/response/api/handler/IHandlerResponseApi";
import { ICommandArguments } from "../args/ICommandArguments";

/**
 * The handler parameters are passed to the instantiated command handler and populated by the command processor. The
 * parameters supply everything a command handler needs to operate: arguments, response object, profiles, the command
 * definition document, and more.
 *
 * Handlers should NEVER perform their own console/stdout/stderr invocations. The response object is provided for all
 * messaging and logging capabilities.
 *
 * @export
 * @interface IHandlerParameters
 */
export interface IHandlerParameters {

    /**
     * The response object used to issue messages and build responses to the command. No command should be
     * writing to console/stdout/stderr directly. The response object provides the capability of collecting
     * responses for the JSON response format (among other capabilities). A handler can choose to log differently,
     * however a logger is also provided on the command response object.
     * @type {IHandlerResponseApi}
     * @memberof IHandlerParameters
     */
    response: IHandlerResponseApi;

    /**
     * The arguments specified by the user on the command line (in the Yargs object format).
     * @type {Arguments}
     * @memberof IHandlerParameters
     */
    arguments: ICommandArguments;

    /**
     * The positional options specified by the user on the command line.
     * @type {string[]}
     * @memberof IHandlerParameters
     */
    positionals: string[];

    /**
     * The set of profiles loaded for this command handler - the map is built with the key being the type and it
     * returns the set of profiles loaded of that type. Multiple profiles can be loaded of the same type - depending
     * on the request and the 0th entry is the first loaded.
     * @internal
     * @type {Map<string, IProfile[]>}
     * @memberof IHandlerParameters
     */
    profiles: CommandProfiles;

    /**
     * The command definition node that defines the command being issued.
     * @type {ICommandDefinition}
     * @memberof IHandlerParameters
     */
    definition: ICommandDefinition;

    /**
     * The full command definition tree that includes the command being issued.
     * @type {ICommandDefinition}
     * @memberof IHandlerParameters
     */
    fullDefinition: ICommandDefinition;

    /**
     * The input stream that can be used by the command being issued.
     * @type {stream.Readable}
     * @memberof IHandlerParameters
     */
    stdin: stream.Readable;

    /**
     * Has your command been invoked from a chained handler? (see ICommandDefinition.chainedHandlers)
     *  You can use this to influence the behavior of your command (e.g. not printing certain messages from within a chained command)
     */
    isChained?: boolean;
}
