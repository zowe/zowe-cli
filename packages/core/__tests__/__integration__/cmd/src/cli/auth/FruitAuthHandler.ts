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

import { BaseAuthHandler, AbstractSession, ICommandArguments, ISession, SessConstants } from "../../../../../../lib";

/**
 * This class is used by the auth command handlers as the base class for their implementation.
 */
export default class ApimlAuthHandler extends BaseAuthHandler {
    /**
     * The profile type where token type and value should be stored
     */
    protected mProfileType: string = "base";

    /**
     * The default token type to use if not specified as a command line option
     */
    protected mDefaultTokenType: SessConstants.TOKEN_TYPE_CHOICES = SessConstants.TOKEN_TYPE_JWT;

    /**
     * This is called by the {@link BaseAuthHandler#process} when it needs a
     * session. Should be used to create a session to connect to the auth
     * service.
     * @param {ICommandArguments} args The command line arguments to use for building the session
     * @returns {ISession} The session object built from the command line arguments.
     */
    protected createSessCfgFromArgs(args: ICommandArguments): ISession {
        return {
            hostname: "fakeHost",
            port: 3000,
            user: args.user,
            password: args.password,
            cert: args.certFile,
            certKey: args.certKeyFile,
            tokenType: args.tokenType,
            tokenValue: args.tokenValue
        };
    }

    /**
     * This is called by the "auth login" command after it creates a session, to
     * obtain a token that can be stored in a profile.
     * @param {AbstractSession} session The session object to use to connect to the auth service
     * @returns {Promise<string>} The response from the auth service containing a token
     */
    protected async doLogin(session: AbstractSession) {
        if (session.ISession.user) {
            return `${session.ISession.user}:${session.ISession.password}@fakeToken`;
        } else {
            return `fakeCertificate@fakeToken`;
        }
    }

    /**
     * This is called by the "auth logout" command after it creates a session, to
     * revoke a token before removing it from a profile.
     * @param {AbstractSession} session The session object to use to connect to the auth service
     */
    protected async doLogout(session: AbstractSession) {
        // Do nothing.
    }
}
