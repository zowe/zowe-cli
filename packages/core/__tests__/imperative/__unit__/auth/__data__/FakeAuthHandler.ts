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

import { BaseAuthHandler } from "../../../../../src/imperative/auth/handlers/BaseAuthHandler";
import { ICommandArguments } from "../../../../../cmd";
import { ISession, AbstractSession, SessConstants } from "../../../../../rest";

export default class FakeAuthHandler extends BaseAuthHandler {
    public mProfileType: string = "fruit";

    public mDefaultTokenType: SessConstants.TOKEN_TYPE_CHOICES = SessConstants.TOKEN_TYPE_JWT;

    protected createSessCfgFromArgs(args: ICommandArguments): ISession {
        return { hostname: "fakeHost", port: 3000 };
    }

    protected async doLogin(session: AbstractSession): Promise<string> {
        return "fakeToken";
    }

    protected async doLogout(session: AbstractSession): Promise<void> { /* Do nothing */ }
}
