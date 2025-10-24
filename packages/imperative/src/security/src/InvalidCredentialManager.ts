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

import { AbstractCredentialManager, SecureCredential } from "./abstract/AbstractCredentialManager";
import { BadCredentialManagerError } from "./errors/BadCredentialManagerError";
import { ICredentialManagerOptions } from "./doc/ICredentialManagerOptions";

/**
 * **NOTE** THIS CLASS SHOULD NOT BE EXPORTED FOR PUBLIC CONSUMPTION.
 *
 * This class is the fallback class when a credential manager fails to initialize.
 * All methods in this class must throw te error passed in by the constructor.
 */
export class InvalidCredentialManager extends AbstractCredentialManager {
    /**
     * Construct the credential manager object.
     * @param service A service that needs to be passed to the superclass
     * @param causeError The load failure that has occurred
     * @param options Optional configuration options for the credential manager (not used in this implementation)
     */
    constructor(
        protected readonly service: string,
        private readonly causeError: Error,
        options?: ICredentialManagerOptions
    ) {
        super(service, "Imperative Invalid Credential Manager", options);
    }

    protected async deleteCredentials(_account: string): Promise<void> {
        throw new BadCredentialManagerError(this.causeError);
    }

    protected async loadCredentials(_account: string, _optional?: boolean): Promise<SecureCredential> {
        throw new BadCredentialManagerError(this.causeError);
    }

    protected async saveCredentials(_account: string, _credentials: SecureCredential): Promise<void> {
        throw new BadCredentialManagerError(this.causeError);
    }
}
