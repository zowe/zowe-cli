/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { AbstractSession, ICommandHandler, IHandlerParameters, IProfile } from "@brightside/imperative";
import { ZosmfSession } from "../index";

/**
 * This class is used by the various handlers in the project as the base class for their implementation.
 *
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
     * This will grab the arguments and create a session before calling the subclass
     * {@link ZosmfBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(commandParameters: IHandlerParameters) {
        this.mZosmfProfile = commandParameters.profiles.get("zosmf");
        this.mSession = ZosmfSession.createBasicZosmfSessionFromArguments(commandParameters.arguments);
        await this.processWithSession(commandParameters);
    }

    /**
     * This is called by the {@link ZosmfBaseHandler#process} after it creates a session.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler.
     *
     */
    public abstract async processWithSession(
        commandParameters: IHandlerParameters,
    ): Promise<void>;
}
