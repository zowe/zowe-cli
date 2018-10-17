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
import { ZosmfSession } from "./index";



/**
 * This class is used by the various zosfiles handlers as the base class for their implementation.
 * All handlers within zosfiles should extend this class.
 *
 * This class should not be used outside of the zosfiles package.
 *
 * @private
 */
export abstract class ZosmfBaseHandler implements ICommandHandler {
    /**
     * This will grab the arguments and create a session before calling the subclass
     * {@link ZosmfBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(commandParameters: IHandlerParameters) {
        const profile = commandParameters.profiles.get("zosmf");
        const session = ZosmfSession.createBasicZosmfSessionFromArguments(commandParameters.arguments);
        await this.processWithSession(commandParameters, session, profile);
    }

    /**
     * This is called by the {@link ZosmfBaseHandler#process} after it creates a session. Should
     * be used so that every handler in the project does not have to instantiate the session object.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler.
     * @param {AbstractSession} session The session object generated from the zosmf profile.
     * @param {IProfile} zosmfProfile The zosmf profile that was loaded for the command.
     *
     * @returns {Promise<IZosFilesResponse>} The response from the underlying zos-files api call.
     */
    public abstract async processWithSession(
        commandParameters: IHandlerParameters,
        session: AbstractSession,
        zosmfProfile: IProfile
    ): Promise<void>;
}
