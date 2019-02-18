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

import { ISession } from "./doc/ISession";
/**
 * Non-abstract session class
 * @export
 * @class Session
 */
export declare class Session {
    /**
     * Obtain session info and defaults
     * @readonly
     * @type {ISession}
     * @memberof Session
     */
    public readonly ISession: ISession;

    /**
     * Creates an instance of Session.
     * @param {ISession} newSession - contains input for new session
     * @memberof Session
     */
    constructor(newSession: ISession);
}
