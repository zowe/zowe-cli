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

export interface ICommandProfileAutoInitConfig {
    /**
     * Path to the handler for the authentication service.
     * The handler should inherit from Imperative BaseAuthHandler.
     */
    handler: string;

    /**
     * The provider giving connection information and details for the automatically generated config
     */
    provider: string;

    /**
     * Command properties for `config auto-init`
     */
    autoInit?: IPartialCommandDefinition;

    /**
     * The type of profile associated with the provider, if any
     */
    profileType?: string;
}
