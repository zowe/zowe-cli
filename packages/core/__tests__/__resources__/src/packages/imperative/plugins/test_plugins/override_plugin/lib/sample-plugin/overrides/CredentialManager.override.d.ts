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

import { Logger } from "@zowe/core-for-zowe-sdk";
declare const _default: {
    new (service: string): {
        consoleLog: Logger;
        deleteCredentials(account: string): Promise<void>;
        loadCredentials(account: string): Promise<string>;
        saveCredentials(account: string, credentials: string): Promise<void>;
        initialize?(): Promise<void>;
        readonly service: string;
        delete(account: string): Promise<void>;
        load(account: string): Promise<string>;
        save(account: string, secureValue: string): Promise<void>;
    };
};
export = _default;
