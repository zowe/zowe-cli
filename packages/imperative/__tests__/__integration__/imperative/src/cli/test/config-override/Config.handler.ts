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

import {
    ConnectionPropsForSessCfg,
    ICommandHandler,
    IHandlerParameters,
    ISession,
    TextUtils,
    IOverridePromptConnProps
} from "../../../../../../../lib";

interface extendedSession extends ISession {
    someKey?: string
}

export default class ConfigOverrideHandler implements ICommandHandler {
    public async process(parms: IHandlerParameters): Promise<void> {
        const initialSessCfg = {
            rejectUnauthorized: true,
        };
        const args = {
            ...parms.arguments,
            host: "SomeHost",
            port: 1234,
            user: "Check-The-Fake-Password"
        };

        const sessCfgOverride: IOverridePromptConnProps[] = [{
            propertyName: "someKey",
            propertiesOverridden: ["password", "tokenType", "tokenValue", "cert", "certKey", "passphrase"]
        }];
        const sessCfgWithConnProps = await ConnectionPropsForSessCfg.addPropsOrPrompt<extendedSession>(
            initialSessCfg, args, {parms, propertyOverrides: sessCfgOverride, doPrompting: true}
        );

        parms.response.console.log(TextUtils.prettyJson(sessCfgWithConnProps));
    }
}
