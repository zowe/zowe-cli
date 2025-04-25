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
import {
    BaseAuthHandler, AbstractSession, ICommandArguments, IHandlerParameters,
    ImperativeConfig, ISession, SessConstants
} from "@zowe/imperative";
import { Logout, Login } from "@zowe/core-for-zowe-sdk";

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
    protected mDefaultTokenType: SessConstants.TOKEN_TYPE_CHOICES = SessConstants.TOKEN_TYPE_APIML;

    /**
     * The description of your service to be used in CLI prompt messages
     */
    protected mServiceDescription: string = "your API Mediation Layer";

    /**
     * This is called by the {@link BaseAuthHandler#process} when it needs a
     * session. Should be used to create a session to connect to the auth
     * service.
     * @param {ICommandArguments} args The command line arguments to use for building the session
     * @returns {ISession} The session object built from the command line arguments.
     */
    protected createSessCfgFromArgs: (args: ICommandArguments) => ISession = ZosmfSession.createSessCfgFromArgs;

    /**
     * Extends the functionality of BaseAuthHandler.processLogin to place a property of
     * authOrder: "token" into the default zosmf profile.
     * @param {IHandlerParameters} params Command parameters sent by imperative.
     */
    protected async processLogin(params: IHandlerParameters) {
        await super.processLogin(params);

        // get the name of the default zosmf profile
        const addAuthOrderMsg = 'Add the following authOrder property to a zosmf profile that contains a basePath property.\n' +
            '    "authOrder": "token"';
        const zosmfProfNm = ImperativeConfig.instance.config?.properties.defaults["zosmf"];
        if (!zosmfProfNm) {
            params.response.console.log(`\nYou have no default zosmf profile. ${addAuthOrderMsg}`);
            return;
        }

        const config = ImperativeConfig.instance.config;
        if (!config.api.profiles.exists(zosmfProfNm)) {
            params.response.console.log(
                `\nYour default zosmf profile (${zosmfProfNm}) does not exist. ${addAuthOrderMsg}`
            );
            return;
        }

        const zosmfProfObj = config.api.profiles.get(zosmfProfNm, true);
        if (!zosmfProfObj?.basePath) {
            params.response.console.log(
                `\nYour default zosmf profile (${zosmfProfNm}) has no basePath, thus it cannot be used with APIML. ` +
                `${addAuthOrderMsg}`
            );
            return;
        }

        if (zosmfProfObj?.authOrder) {
            // we already have an authOrder in this zosmf profile
            if (zosmfProfObj.authOrder.search(/^ *token/) >= 0) {
                // token is at the start of the authOrder, so no need to add or replace authOrder
                return;
            }
        }

        // Ensure that the zosmf profile uses the newly acquired token by setting authOrder to token
        const beforeLayer = config.api.layers.get();
        const layer = config.api.layers.find(zosmfProfNm);
        if (layer != null) {
            const { user, global } = layer;
            config.api.layers.activate(user, global);
        }
        const profilePath = config.api.profiles.getProfilePathFromName(zosmfProfNm);
        config.set(`${profilePath}.properties.authOrder`, "token");
        await config.save();

        // Restore the original layer
        config.api.layers.activate(beforeLayer.user, beforeLayer.global);
    }

    /**
     * This is called by the "auth login" command after it creates a session, to
     * obtain a token that can be stored in a profile.
     * @param {AbstractSession} session The session object to use to connect to the auth service
     * @returns {Promise<string>} The response from the auth service containing a token
     */
    protected async doLogin(session: AbstractSession) {
        return Login.apimlLogin(session);
    }

    /**
     * This is called by the "auth logout" command after it creates a session, to
     * revoke a token before removing it from a profile.
     * @param {AbstractSession} session The session object to use to connect to the auth service
     */
    protected async doLogout(session: AbstractSession) {
        return Logout.apimlLogout(session);
    }
}
