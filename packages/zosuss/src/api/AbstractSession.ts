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

import { Logger } from "@brightside/imperative";
import { ISession } from "./doc/ISession";
import { isNullOrUndefined } from "util";

/**
 * The SSH session object that contains the fields that are required by
 * most SSH connection (hostname, port, username, password etc).
 * @export
 * @abstract
 * @class AbstractSession
 */
export abstract class AbstractSession {
    /**
     * Default ssh port 22
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_SSH_PORT = 22;

    /**
     * Default ssh port
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_PORT = AbstractSession.DEFAULT_SSH_PORT;
    /**
     * Logging object
     */
    private mLog: Logger;

    /**
     * Creates an instance of AbstractSession.
     * @param {ISession} session: Session parameter object
     * @memberof AbstractSession
     */
    constructor(private mISession: ISession) {
        this.mLog = Logger.getImperativeLogger();
        mISession = this.buildSession(mISession);
    }

    /**
     * Builds an ISession so all required pieces are filled in
     * @private
     * @param {ISession} session - the fully populated session
     * @memberof AbstractSession
     */
    private buildSession(session: ISession): ISession {
        const populatedSession = session;

        // set port if not set
        if (isNullOrUndefined(populatedSession.port)) {
            populatedSession.port = AbstractSession.DEFAULT_SSH_PORT;
        }
        return populatedSession;
    }

    /**
     * Obtain session info and defaults
     * @readonly
     * @type {ISession}
     * @memberof AbstractSession
     */
    get ISession(): ISession {
        return this.mISession;
    }
}
