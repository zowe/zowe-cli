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

import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { BaseAutoInitHandler, AbstractSession, ICommandArguments, ISession, Config,
         ImperativeConfig, IHandlerParameters, ConfigConstants, TextUtils, SessConstants, IConfig } from "@zowe/imperative";
import { Login, Services } from "@zowe/core-for-zowe-sdk";

/**
 * This class is used by the auth command handlers as the base class for their implementation.
 */
export default class ApimlAutoInitHandler extends BaseAutoInitHandler {
    /**
     * The profile type where token type and value should be stored
     */
    protected mProfileType: string = "base";

    /**
     * The description of your service to be used in CLI prompt messages
     */
    protected mServiceDescription: string = "the APIML service";

    /**
     * This is called by the {@link BaseAuthHandler#process} when it needs a
     * session. Should be used to create a session to connect to the auto-init
     * service.
     * @param {ICommandArguments} args The command line arguments to use for building the session
     * @returns {ISession} The session object built from the command line arguments.
     */
    protected createSessCfgFromArgs: (args: ICommandArguments) => ISession = ZosmfSession.createSessCfgFromArgs;

    /**
     * This is called by the "auto-init" command after it creates a session, to generate a configuration
     * @param {AbstractSession} session The session object to use to connect to the configuration service
     * @returns {Promise<string>} The response from the auth service containing a token
     */
    protected async doAutoInit(session: AbstractSession, params: IHandlerParameters): Promise<IConfig> {
        const configs = Services.getPluginApimlConfigs();
        const profileInfos = await Services.getServicesByConfig(session, configs);
        const profileConfig = Services.convertApimlProfileInfoToProfileConfig(profileInfos);

        // Populate the config with base profile information
        if (profileConfig.defaults.base == null && profileConfig.profiles.my_base == null) {
            profileConfig.profiles.my_base = {
                type: "base",
                properties: {
                    host: session.ISession.hostname,
                    port: session.ISession.port
                },
                secure: []
            }
            profileConfig.defaults.base = "my_base"

            if (session.ISession.tokenType != null && session.ISession.tokenValue != null) {
                profileConfig.profiles.my_base.properties.authToken = `${session.ISession.tokenType}=${session.ISession.tokenValue}`
                profileConfig.profiles.my_base.secure.push("authToken");
            } else if (session.ISession.user && session.ISession.password) {
                const tokenType = SessConstants.TOKEN_TYPE_APIML;
                session.ISession.tokenType = tokenType;
                session.ISession.type = SessConstants.AUTH_TYPE_TOKEN;
                const tokenValue = await Login.apimlLogin(session);
                profileConfig.profiles.my_base.properties.authToken = `${tokenType}=${tokenValue}`;
                profileConfig.profiles.my_base.secure.push("authToken");
            }
        }

        return profileConfig;
    }
}
