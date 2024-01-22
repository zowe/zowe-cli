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

import { ImperativeError } from "../../../error";

/**
 * This error is thrown when a call to {@link PluginRequireProvider.destroyPluginHooks} has
 * been made without hooks in place.
 */
export class PluginRequireNotCreatedError extends ImperativeError {
    constructor() {
        super({
            msg: "Hooks have not been initialized. Please use `PluginRequireProvider.createPluginHooks(...)` first"
        });
    }
}
