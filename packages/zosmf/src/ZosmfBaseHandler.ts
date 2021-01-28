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
    AbstractSession,
    ICommandArguments,
    ICommandHandler,
    IHandlerParameters,
    IProfile,
    IHandlerResponseConsoleApi,
    IHandlerFormatOutputApi,
    IHandlerResponseDataApi,
    IHandlerProgressApi,
    IImperativeError,
    ImperativeError,
    IProfileLoaded,
    ISession,
    Session,
    ConnectionPropsForSessCfg
} from "@zowe/imperative";
import { ZosmfSession } from "./ZosmfSession";

/**
 * This class is used by the various handlers in the project as the base class for their implementation.
 */
export abstract class ZosmfBaseHandler implements ICommandHandler {

    /**
     * The session creating from the command line arguments / profile
     */
    protected mSession: AbstractSession;

    /**
     * Loaded z/OSMF profile if needed
     */
    protected mZosmfProfile: IProfile;

    /**
     * Loaded z/OSMF profile with meta information
     */
    protected mZosmfLoadedProfile: IProfileLoaded;

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
     * {@link ZosmfBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(commandParameters: IHandlerParameters) {

        this.mHandlerParams = commandParameters;
        this.mZosmfProfile = commandParameters.profiles.get("zosmf", false);
        this.mZosmfLoadedProfile = commandParameters.profiles.getMeta("zosmf", false);

        const sessCfg: ISession = ZosmfSession.createSessCfgFromArgs(
            commandParameters.arguments
        );

        const sessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            sessCfg, commandParameters.arguments, {parms: commandParameters}
        );

        this.mSession = new Session(sessCfgWithCreds);
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
     * This is called by the {@link ZosmfBaseHandler#process} after it creates a session.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler.
     *
     */
    public abstract async processCmd(
        commandParameters: IHandlerParameters
    ): Promise<void>;
}
