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

import { ICommandArguments } from "../../../../cmd";
import { AbstractSession, IOptionsForAddConnProps, ISession } from "../../../../rest";

/**
 * Auth handler API that provides convenient functions to create a session from
 * args, and use it to login or logout of an auth service.
 */
export interface IAuthHandlerApi {
    /**
     * Prompting options for adding connection properties.
     * The properties `defaultTokenType` and `serviceDescription` should be defined.
     */
    promptParams: IOptionsForAddConnProps;

    /**
     * Method to create a session config object from CLI arguments.
     * This is equivalent to the handler method `createSessCfgFromArgs`.
     */
    createSessCfg: (args: ICommandArguments) => ISession;

    /**
     * Method to login to authentication service with a session.
     * This is equivalent to the handler method `doLogin`.
     */
    sessionLogin: (session: AbstractSession) => Promise<string>;

    /**
     * Method to logout of authentication service with a session.
     * This is equivalent to the handler method `doLogout`.
     */
    sessionLogout: (session: AbstractSession) => Promise<void>;
}
