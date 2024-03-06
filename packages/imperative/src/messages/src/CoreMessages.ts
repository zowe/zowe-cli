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

import { IMessageDefinition } from "./doc/IMessageDefinition";
import { Constants } from "../../constants";

export const apiErrorHeader: IMessageDefinition = {
    message: `${Constants.FRAMEWORK_DISPLAY_NAME} API Error`
};

export const couldNotInstantiateCommandHandler: IMessageDefinition = {
    message: `Could not instantiate the handler {{commandHandler}} for ` +
        `command {{definitionName}}`
};

export const errorDetailsHeader: IMessageDefinition = {
    message: "Error Details:"
};

export const unexpectedCommandError: IMessageDefinition = {
    message: "Unexpected Command Error"
};

export const unexpectedCommandPreparationError: IMessageDefinition = {
    message: "An unexpected command preparation error occurred:"
};

export const syntaxErrorHeader: IMessageDefinition = {
    message: `\nSyntax Error`
};

export const authCategorySummary: IMessageDefinition = {
    message: `Connect to token-based authentication services`
};

export const authCategoryDesc: IMessageDefinition = {
    message: `${authCategorySummary.message}.`
};

export const authLoginGroupSummary: IMessageDefinition = {
    message: `Log in to an authentication service`
};

export const authLoginGroupDesc: IMessageDefinition = {
    message: `${authLoginGroupSummary.message}.`
};

export const authLoginCommandDesc: IMessageDefinition = {
    message: `Log in to {{type}} authentication service.`
};

export const authLoginShowTokenDesc: IMessageDefinition = {
    message: `Show the token when login is successful. If specified, does not save the token to a profile.`
};

export const authLogoutGroupSummary: IMessageDefinition = {
    message: `Log out of an authentication service`
};

export const authLogoutGroupDesc: IMessageDefinition = {
    message: `${authLogoutGroupSummary.message}.`
};

export const authLogoutCommandDesc: IMessageDefinition = {
    message: `Log out of {{type}} authentication service.`
};

export const autoInitCommandSummary: IMessageDefinition = {
    message: `Automatically generate a config from {{source}}`
};

export const autoInitCommandDesc: IMessageDefinition = {
    message: `${autoInitCommandSummary.message}.`
};
