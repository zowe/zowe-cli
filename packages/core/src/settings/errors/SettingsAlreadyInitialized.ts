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

import { ImperativeError } from "../../error/ImperativeError";

/**
 * This class represents an error that is thrown when a second settings singleton attempts to initialize.
 */
export class SettingsAlreadyInitialized extends ImperativeError {
    constructor() {
        super({
            msg: "AppSettings can only be initialized once per application. Please use AppSettings.instance instead!"
        });
    }
}
