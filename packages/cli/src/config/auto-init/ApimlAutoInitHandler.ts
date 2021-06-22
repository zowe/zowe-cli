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
import { BaseAutoInitHandler, AbstractSession, ICommandArguments, ISession, SessConstants,
         Session, ImperativeConfig, IHandlerParameters, ConnectionPropsForSessCfg } from "@zowe/imperative";
import { Services } from "@zowe/core-for-zowe-sdk";

/**
 * This class is used by the auth command handlers as the base class for their implementation.
 */
export default class ApimlAutoInitHandler extends BaseAutoInitHandler {
    /**
     * The profile type where token type and value should be stored
     */
    protected mProfileType: string = "base";

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
    protected async doAutoInit(session: AbstractSession, params: IHandlerParameters) {
        const configs = Services.getPluginApimlConfigs();
        const profileInfos = await Services.getServicesByConfig(session, configs);
        const profileConfig = Services.convertApimlProfileInfoToProfileConfig(profileInfos);

        let global = false;
        let user = false;

        // Use params to set which config layer to apply to
        if (params.arguments.global) {
            global = true;
        }
        if (params.arguments.user) {
            user = true
        }
        ImperativeConfig.instance.config.mActive.user = user;
        ImperativeConfig.instance.config.mActive.global = global;
        ImperativeConfig.instance.config.api.layers.merge(profileConfig);
        await ImperativeConfig.instance.config.api.layers.write({user, global}); 
    }
}
