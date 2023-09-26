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

import { BaseAutoInitHandler } from "../../../../../src/config/cmd/auto-init/handlers/BaseAutoInitHandler";
import { ICommandArguments, IHandlerResponseApi } from "../../../../../../cmd";
import { ISession, AbstractSession } from "../../../../../../rest";

export class FakeAutoInitHandler extends BaseAutoInitHandler {
    public mProfileType: string = "fruit";

    public createSessCfgFromArgs(args: ICommandArguments): ISession {
        return { hostname: "fakeHost", port: 3000 };
    }

    protected async doAutoInit(session: AbstractSession): Promise<void> { /* Do nothing */ }

    protected displayAutoInitChanges(response: IHandlerResponseApi): void { /* Do nothing */ }
}
