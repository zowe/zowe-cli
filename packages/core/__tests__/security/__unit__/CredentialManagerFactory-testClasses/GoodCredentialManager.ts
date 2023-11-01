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

import { AbstractCredentialManager, SecureCredential } from "../..";

/**
 * This class is used to test the Credential Manager Factory load class method
 * for a class that does not have an init method.
 */
export = class NoInitializeCredentialManager extends AbstractCredentialManager {
    public static readonly hardcodeService = "send-the-service-in";

    public readonly credentials = "username:password";

    constructor(service: string, displayname: string) {
        super(NoInitializeCredentialManager.hardcodeService, displayname);
    }

    protected async deleteCredentials(account: string): Promise<void> {
        return;
    }

    protected async loadCredentials(account: string): Promise<SecureCredential> {
        return this.credentials;
    }

    protected async saveCredentials(account: string, credentials: SecureCredential): Promise<void> {
        return;
    }
};
