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
 * This error is thrown when a second call to {@link PluginRequireProvider.createPluginHooks} has
 * been made without destroying a previous hook call.
 */
export class PluginRequireAlreadyCreatedError extends ImperativeError {
    constructor() {
        super({
            msg: "Plugin requires have already been overridden. Cannot add a second hook!"
        });
    }
}
