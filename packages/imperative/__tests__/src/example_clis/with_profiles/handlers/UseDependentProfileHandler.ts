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

import { ICommandHandler, IHandlerParameters } from "../../../../../src/cmd";

export default class UseDependentProfile implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        // eslint-disable-next-line deprecation/deprecation
        const dependencyProfile = params.profiles.get("profile-a");
        params.response.console.log("Loaded profile dependency of type profile-a");
        // eslint-disable-next-line deprecation/deprecation
        const mainProfile = params.profiles.get("profile-with-dependency");
        params.response.console.log("Loaded main profile of type profile-with-dependency");
    }
}
