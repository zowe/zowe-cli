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

import { IPartialCommandDefinition } from "../../IPartialCommandDefinition";

export interface ICommandProfileAuthConfig {
    /**
     * Name of the authentication service
     */
    serviceName: string;

    /**
     * Path to the handler for the authentication service.
     * The handler should inherit from Imperative BaseAuthHandler.
     */
    handler: string;

    /**
     * Command properties for `auth login <serviceName>`
     */
    login?: IPartialCommandDefinition;

    /**
     * Command properties for `auth logout <serviceName>`
     */
    logout?: IPartialCommandDefinition;
}
