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

import { ISession } from "./ISession";

/**
 * Interface for overriding the prompting behavior of ConnectionPropsForSessCfg.addPropsOrPrompt()
 * @export
 * @interface IOverridePromptConnProps
 */
export interface IOverridePromptConnProps {
    /**
     * Indicates the session property that should be considered in the prompting logic.
     */
    propertyName: string;

    /**
     * Indicates the CLI argument that should be used to populate the property on the session.
     * If not supplied, uses a CLI argument that matches the session property name.
     */
    argumentName?: string;

    /**
     * Indicates the prompting fields the property should override. For example, if the property should be the preferred method of authentication,
     * then it should override user and password. Then, if the property is on the session, it will not prompt for user and password.
     * Prompting logic is only in place for host, port, user, and password, but cert, certKey, tokenType, and tokenValue may also need
     * to be overridden.
     */
    propertiesOverridden: (keyof ISession)[];
}