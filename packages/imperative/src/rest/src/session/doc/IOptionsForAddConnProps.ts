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

import { SessConstants } from "../../..";

/**
 * Interface for options supplied to ConnectionPropsForSessCfg.addPropsOrPrompt()
 * @export
 * @interface ISession
 */
export interface IOptionsForAddConnProps {

    /**
     * Indicates that we want to generate a token.
     * When true, we use the user and password for the operation
     * to obtain a token. This applies during a login command.
     * Otherwise, you typically want this to be false.
     * The default value is false.
     */
    requestToken?: boolean;

    /**
     * Indicates that want to prompt for user name and password when
     * no form of credentials are supplied. CLI programs typically
     * want this to be true. A GUI app calling the API may do its
     * own prompting in the GUI and would set this value to false.
     * The default value is true.
     */
    doPrompting?: boolean;

    /**
     * Specifies the default token type if not provided on the command line.
     * Some commands such as "auth login" do not have a "tokenType" command line
     * option, but still need to specify a default token type.
     * The default value is TOKEN_TYPE_JWT.
     */
    defaultTokenType?: SessConstants.TOKEN_TYPE_CHOICES;

    /**
     * Specifies the functionality that external applications will use for prompting.
     * Activate this function to get all the needed properties
     * @example
     * const connectableSessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
     *           sessCfg, commandParameters.arguments, {getValuesBack: YourOwnFunction}
     *      );
     */
    getValuesBack? (properties: string[]): { [key: string]: any };
}
