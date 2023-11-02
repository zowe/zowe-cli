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

import { AbstractSession } from "../src/rest/src/session/AbstractSession";
export class RestClient {
    public static getExpectString(session: AbstractSession, resource: string, reqHeaders?: any[]) {
        return new Promise((resolve, reject) => {
            process.nextTick(
                () => {
                    resolve("hey man");
                }
            );
        });
    }
}
