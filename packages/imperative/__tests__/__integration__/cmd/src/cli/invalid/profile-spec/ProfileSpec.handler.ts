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

import { ICommandHandler, IHandlerParameters } from "../../../../../../../lib";

export default class ProfileSpecHandler implements ICommandHandler {
    public async process(params: IHandlerParameters): Promise<void> {
        // eslint-disable-next-line deprecation/deprecation
        params.profiles.get("blah");
    }
}
