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

import { IHandlerParameters, ICommandHandler, ImperativeConfig, TextUtils } from "../../../../../../../lib/index";

export default class FirstGroupCommandOneHandler implements ICommandHandler {
    public async process(params: IHandlerParameters): Promise<void> {
        const prof = ImperativeConfig.instance.config.api.profiles.get("blah");
        params.response.console.log(TextUtils.prettyJson(prof));
    }
}
