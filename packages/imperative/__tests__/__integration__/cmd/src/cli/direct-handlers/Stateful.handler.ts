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

import { ICommandHandler, IHandlerParameters, ImperativeError } from "../../../../../../lib/index";

export default class StatefulHandler implements ICommandHandler {
    private invocations = 0;

    public async process(params: IHandlerParameters): Promise<void> {
        if (params.arguments.fail) {
            throw new ImperativeError({ msg: "Direct handler failed" });
        }
        this.invocations++;
        const value = `${params.arguments.value}:${this.invocations}`;
        params.response.console.log("invocations: %d; value: %s", this.invocations, value);
        params.response.data.setObj({ invocations: this.invocations, value });
    }
}
