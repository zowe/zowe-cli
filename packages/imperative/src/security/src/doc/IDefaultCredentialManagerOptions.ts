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

import type { ICredentialManagerOptions } from "./ICredentialManagerOptions";

/** 
 * Used to map value in `imperative.json` to respective value for Win32 persistence flag in CredentialA. See {@link PersistenceValue} for flag values. 
 */
export enum PersistenceLevel {
    SessionOnly = "session",
    LocalMachine = "local_machine",
    Enterprise = "enterprise"
}

/** 
 * Note: Values map to `Persist` variable in [CredentialA](https://learn.microsoft.com/en-us/windows/win32/api/wincred/ns-wincred-credentiala) structure.
 */
export enum PersistenceValue {
    // CRED_PERSIST_SESSION
    SessionOnly = 1,
    // CRED_PERSIST_LOCAL_MACHINE
    LocalMachine = 2,
    // CRED_PERSIST_ENTERPRISE
    Enterprise = 3
}

export interface IDefaultCredentialManagerOptions extends ICredentialManagerOptions {
    persist?: PersistenceLevel;
}