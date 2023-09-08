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

import { ICommandHandler, IHandlerParameters, ICommandArguments } from "../../../../cmd";
import { Constants } from "../../../../constants";
import { ISession, ConnectionPropsForSessCfg, Session, SessConstants, AbstractSession } from "../../../../rest";
import { Imperative } from "../../Imperative";
import { ImperativeExpect } from "../../../../expect";
import { ImperativeError } from "../../../../error";
import { ISaveProfileFromCliArgs } from "../../../../profiles";
import { CliUtils } from "../../../../utilities";

/**
 * This class is used by the auth command handlers as the base class for their implementation.
 */
export abstract class BaseAuthHandler implements ICommandHandler {
    /**
     * The profile type where token type and value should be stored
     */
    protected abstract mProfileType: string;

    /**
     * The default token type to use if not specified as a command line option
     */
    protected abstract mDefaultTokenType: SessConstants.TOKEN_TYPE_CHOICES;

    /**
     * The session being created from the command line arguments / profile
     */
    protected mSession: AbstractSession;

    /**
     * This handler is used for both "auth login" and "auth logout" commands.
     * It determines the correct action to take and calls either `processLogin`
     * or `processLogout` accordingly.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(commandParameters: IHandlerParameters) {
        switch (commandParameters.positionals[1]) {
            case Constants.LOGIN_ACTION:
            case Constants.LOGIN_ACTION_ALIAS:
                await this.processLogin(commandParameters);
                break;
            case Constants.LOGOUT_ACTION:
            case Constants.LOGOUT_ACTION_ALIAS:
                await this.processLogout(commandParameters);
                break;
            default:
                throw new ImperativeError({
                    msg: `The group name "${commandParameters.positionals[1]}" was passed to the BaseAuthHandler, but it is not valid.`
                });
                break;
        }
    }

    /**
     * This is called by the {@link BaseAuthHandler#process} when it needs a
     * session. Should be used to create a session to connect to the auth
     * service.
     * @abstract
     * @param {ICommandArguments} args The command line arguments to use for building the session
     * @returns {ISession} The session object built from the command line arguments.
     */
    protected abstract createSessCfgFromArgs(args: ICommandArguments): ISession;

    /**
     * This is called by the "auth login" command after it creates a session, to
     * obtain a token that can be stored in a profile.
     * @abstract
     * @param {AbstractSession} session The session object to use to connect to the auth service
     * @returns {Promise<string>} The response from the auth service containing a token
     */
    protected abstract async doLogin(session: AbstractSession): Promise<string>;

    /**
     * This is called by the "auth logout" command after it creates a session, to
     * revoke a token before removing it from a profile.
     * @abstract
     * @param {AbstractSession} session The session object to use to connect to the auth service
     */
    protected abstract async doLogout(session: AbstractSession): Promise<void>;

    /**
     * Performs the login operation. Builds a session to connect to the auth
     * service, sends a login request to it to obtain a token, and stores the
     * resulting token in the profile of type `mProfileType`.
     * @param {IHandlerParameters} params Command parameters sent by imperative.
     */
    private async processLogin(params: IHandlerParameters) {
        const loadedProfile = params.profiles.getMeta(this.mProfileType, false);

        const sessCfg: ISession = this.createSessCfgFromArgs(
            params.arguments
        );
        const sessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            sessCfg, params.arguments,
            { requestToken: true, defaultTokenType: this.mDefaultTokenType }
        );

        this.mSession = new Session(sessCfgWithCreds);
        this.mSession.ISession.storeCookie = true;

        // login to obtain a token.
        const tokenValue = await this.doLogin(this.mSession);
        this.mSession.ISession.storeCookie = false;

        // validate a token was returned
        if (tokenValue == null) {
            throw new ImperativeError({msg: "A token value was not returned from the login handler."});
        }

        // update the profile given
        if (!params.arguments.showToken) {
            let profileWithToken: string = null;

            if (loadedProfile != null && loadedProfile.name != null) {
                await Imperative.api.profileManager(this.mProfileType).update({
                    name: loadedProfile.name,
                    args: {
                        "token-type": this.mSession.ISession.tokenType,
                        "token-value": tokenValue
                    },
                    merge: true
                });
                profileWithToken = loadedProfile.name;
            } else {

                // Do not store non-profile arguments, user, or password. Set param arguments for prompted values from session.

                const copyArgs = {...params.arguments};
                copyArgs.createProfile = undefined;
                copyArgs.showToken = undefined;
                copyArgs.user = undefined;
                copyArgs.password = undefined;

                copyArgs.host = this.mSession.ISession.hostname;
                copyArgs.port = this.mSession.ISession.port;

                copyArgs.tokenType = this.mSession.ISession.tokenType;
                copyArgs["token-type"] = this.mSession.ISession.tokenType;

                copyArgs.tokenValue = tokenValue;
                copyArgs["token-value"] = tokenValue;

                const createParms: ISaveProfileFromCliArgs = {
                    name: "default",
                    type: this.mProfileType,
                    args: copyArgs,
                    overwrite: false,
                    profile: {}
                };

                const answer: string = await CliUtils.promptWithTimeout(
                    `Do you want to store the host, port, and token on disk for use with future commands? If you answer Yes, the credentials will ` +
                    `be saved to a ${this.mProfileType} profile named '${createParms.name}'. If you answer No, the token will be printed to the ` +
                    `terminal and will not be stored on disk. [y/N]: `);
                if (answer != null && (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes")) {
                    await Imperative.api.profileManager(this.mProfileType).save(createParms);
                    profileWithToken = createParms.name;
                } else {
                    params.arguments.showToken = true;
                }
            }

            if (profileWithToken != null) {
                params.response.console.log(`\n` +
                    `Login successful. The authentication token is stored in the '${profileWithToken}' ` +
                    `${this.mProfileType} profile for future use. To revoke this token and remove it from your profile, review the ` +
                    `'zowe auth logout' command.`);
            }
        }

        // show token instead of updating profile
        if (params.arguments.showToken) {
            params.response.console.log(`\n` +
                `Received a token of type = ${this.mSession.ISession.tokenType}.\n` +
                `The following token was retrieved and will not be stored in your profile:\n` +
                `${tokenValue}\n\n` +
                `Login successful. To revoke this token, review the 'zowe auth logout' command.`
            );
            params.response.data.setObj({tokenType: this.mSession.ISession.tokenType, tokenValue});
        }
    }

    /**
     * Performs the logout operation. Deletes the token and token type from the profile,
     * and rebuilds the session.
     * @param {IHandlerParameters} params Command parameters sent by imperative.
     */
    private async processLogout(params: IHandlerParameters) {
        const loadedProfile = params.profiles.getMeta(this.mProfileType, false);

        ImperativeExpect.toNotBeNullOrUndefined(params.arguments.tokenValue, "Token value not supplied, but is required for logout.");

        // Force to use of token value, in case user and/or password also on base profile, make user undefined.
        if (params.arguments.user != null) {
            params.arguments.user = undefined;
        }

        params.arguments.tokenType = this.mDefaultTokenType;

        const sessCfg: ISession = this.createSessCfgFromArgs(
            params.arguments
        );

        const sessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            sessCfg, params.arguments,
            { requestToken: false }
        );

        this.mSession = new Session(sessCfgWithCreds);

        await this.doLogout(this.mSession);

        // If you specified a token on the command line, then don't delete the one in the profile if it doesn't match
        let profileWithToken: string = null;
        if (loadedProfile != null &&
            loadedProfile.name != null &&
            loadedProfile.profile != null &&
            loadedProfile.profile.tokenValue != null &&
            params.arguments.tokenValue === loadedProfile.profile.tokenValue) {
            await Imperative.api.profileManager(this.mProfileType).save({
                name: loadedProfile.name,
                type: loadedProfile.type,
                overwrite: true,
                profile: {
                    ...loadedProfile.profile,
                    tokenType: undefined,
                    tokenValue: undefined
                }
            });
            profileWithToken = loadedProfile.name;
        }

        this.mSession.ISession.type = SessConstants.AUTH_TYPE_BASIC;
        this.mSession.ISession.tokenType = undefined;
        this.mSession.ISession.tokenValue = undefined;

        params.response.console.log("Logout successful. The authentication token has been revoked" +
            (profileWithToken != null ? ` and removed from your '${profileWithToken}' ${this.mProfileType} profile` : "") +
            ".");
    }
}
