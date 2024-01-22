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

import { ImperativeError } from "../../error";

/**
 * This class represents the error thrown by methods of the {@link InvalidCredentialManager}
 * when initialized by {@link CredentialManagerFactory.initialize}
 */
export class BadCredentialManagerError extends ImperativeError {
    /**
     * Construct the error referencing a specific cause error.
     * @param causeError The error that caused the load failure.
     */
    constructor(causeError: Error) {
        super({
            msg: "An invalid credential manager was passed in to the factory function!",
            additionalDetails: causeError.message,
            causeErrors: causeError
        });
    }
}
