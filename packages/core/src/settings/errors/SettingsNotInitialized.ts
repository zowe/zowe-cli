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
 * This class represents an error thrown when a null singleton {@link AppSettings} object is referenced.
 */
export class SettingsNotInitialized extends ImperativeError {
    constructor() {
        super({
            msg: "AppSettings have not been initialized yet. Please initialize using AppSettings.initialize(...) first!"
        });
    }
}
