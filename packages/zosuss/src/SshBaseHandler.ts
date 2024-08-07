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

import {
    // AbstractSession,
    ICommandArguments,
    ICommandHandler,
    IOverridePromptConnProps,
    IHandlerParameters,
    IProfile,
    IHandlerResponseConsoleApi,
    IHandlerFormatOutputApi,
    IHandlerResponseDataApi,
    IHandlerProgressApi,
    IImperativeError,
    ImperativeError,
    ConnectionPropsForSessCfg,
    SessConstants
} from "@zowe/imperative";
import { SshSession } from "./SshSession";
import { ISshSession } from "./doc/ISshSession";


/**
 * This class is used by the various handlers in the project as the base class for their implementation.
 */
export abstract class SshBaseHandler implements ICommandHandler {

    /**
     * The session creating from the command line arguments / profile
     */
    protected mSession: SshSession;

    /**
     * Loaded z/OS SSH profile if needed
     * @deprecated
     */
    protected mSshProfile: IProfile;

    /**
     * Command line arguments passed
     */
    protected mArguments: ICommandArguments;

    /**
     * Full set of command handler parameters from imperative
     */
    protected mHandlerParams: IHandlerParameters;

    /**
     * This will grab the arguments and create a session before calling the subclass
     * {@link SshBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(commandParameters: IHandlerParameters) {
        this.mHandlerParams = commandParameters;
        // Why is this here? NOTHING uses it, but I suppose an extender MIGHT be... -awharn
        // eslint-disable-next-line deprecation/deprecation
        this.mSshProfile = commandParameters.profiles.get("ssh", false);

        const sshSessCfgOverride: IOverridePromptConnProps[] = [{
            propertyName: "privateKey",
            propertiesOverridden: ["password", "tokenType", "tokenValue", "cert", "certKey", "passphrase"]
        }];
        const sshSessCfg: ISshSession = SshSession.createSshSessCfgFromArgs(commandParameters.arguments);
        const sshSessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISshSession>(
            sshSessCfg, commandParameters.arguments, {
                parms: commandParameters,
                propertyOverrides: sshSessCfgOverride,
                supportedAuthTypes: [SessConstants.AUTH_TYPE_BASIC]
            }
        );
        this.mSession = new SshSession(sshSessCfgWithCreds);

        this.mArguments = commandParameters.arguments;
        await this.processCmd(commandParameters);
    }

    /**
     * Fail the command with an imperative error
     * @param {IImperativeError} err - the imperative error parameters
     */
    public fail(err: IImperativeError) {
        throw new ImperativeError(err);
    }

    /**
     * Returns the console interface for the command handler
     * @returns {IHandlerResponseConsoleApi}
     */
    public get console(): IHandlerResponseConsoleApi {
        return this.mHandlerParams.response.console;
    }

    /**
     * Returns the format interface for the command handler
     * @returns {IHandlerFormatOutputApi}
     */
    public get format(): IHandlerFormatOutputApi {
        return this.mHandlerParams.response.format;
    }

    /**
     * Returns the format interface for the command handler
     * @returns {IHandlerResponseDataApi}
     */
    public get data(): IHandlerResponseDataApi {
        return this.mHandlerParams.response.data;
    }

    /**
     * Returns the format interface for the command handler
     * @returns {IHandlerProgressApi}
     */
    public get progress(): IHandlerProgressApi {
        return this.mHandlerParams.response.progress;
    }

    /**
     * This is called by the {@link SshBaseHandler#process} after it creates a session.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler.
     *
     */
    public abstract processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
