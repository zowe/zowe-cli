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

import { AbstractCredentialManager, SecureCredential } from "../../../../../../packages/security";

export class CustomCredentialManagerClass extends AbstractCredentialManager {
    constructor() {
        super("DummyService", "DummyName");
    }

    public async loadCredentials(account: string): Promise<SecureCredential> {
    // We need to stringify to simulate the stored value that we are loading
        const cred: SecureCredential = Buffer.from(JSON.stringify("custom")).toString("base64");
        return cred;
    }

    public async saveCredentials(account: string, credentials: SecureCredential): Promise<void> {
        return;
    }

    public async deleteCredentials(account: string): Promise<void> {
        return;
    }
}
