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

import { AbstractSession, BaseAutoInitHandler, ICommandArguments, IConfig, IHandlerParameters, IHandlerResponseApi,
    ISession, SessConstants } from "../../../../../../lib";

/**
 * This class is used by the auto-init command handlers as the base class for their implementation.
 */
export default class FruitAutoInitHandler extends BaseAutoInitHandler {
    /**
     * The profile type where token type and value should be stored
     */
    protected mProfileType: string = "base";

    /**
     * The description of your service to be used in CLI prompt messages
     */
    protected mServiceDescription: string = "yummy fruit service";

    /**
     * This is called by the {@link BaseAutoInitHandler#process} when it needs a
     * session. Should be used to create a session to connect to the auto-init
     * service.
     * @param {ICommandArguments} args The command line arguments to use for building the session
     * @returns {ISession} The session object built from the command line arguments.
     */
    protected createSessCfgFromArgs(args: ICommandArguments): ISession {
        return {
            hostname: args.host,
            port: args.port,
            user: args.user,
            password: args.password,
            tokenType: args.tokenType,
            tokenValue: args.tokenValue
        };
    }

    /**
     * This is called by the "auto-init" command after it creates a session, to generate a configuration
     * @param {AbstractSession} session The session object to use to connect to the configuration service
     * @returns {Promise<string>} The response from the auth service containing a token
     */
    protected async doAutoInit(session: AbstractSession, params: IHandlerParameters): Promise<IConfig> {
        const tokenType = (session.ISession.type === "basic") ? SessConstants.TOKEN_TYPE_JWT : session.ISession.tokenType;
        const tokenValue = (session.ISession.type === "basic") ?
            `${session.ISession.user}:${session.ISession.password}@fakeToken` : session.ISession.tokenValue;
        return {
            profiles: {
                base_fruit: {
                    type: this.mProfileType,
                    properties: {
                        host: session.ISession.hostname,
                        port: session.ISession.port,
                        tokenType,
                        tokenValue
                    },
                    secure: [
                        "tokenValue"
                    ]
                }
            },
            defaults: {
                [this.mProfileType]: "base_fruit"
            }
        };
    }

    protected displayAutoInitChanges(response: IHandlerResponseApi): void {
        response.console.log("**auto-init changes**");
    }
}
