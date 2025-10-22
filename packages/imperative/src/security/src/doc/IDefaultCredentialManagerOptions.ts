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

export enum PersistenceLevel {
    SessionOnly = "session",
    LocalMachine = "local_machine",
    Enterprise = "enterprise"
}

export enum PersistenceValue {
    SessionOnly = 1,
    LocalMachine = 2,
    Enterprise = 3
}

export interface IDefaultCredentialManagerOptions extends ICredentialManagerOptions {
    persist?: PersistenceLevel;
}