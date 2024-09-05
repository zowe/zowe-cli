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
    ICommandHandler,
    IHandlerParameters,
    ImperativeError,
    ConnectionPropsForSessCfg,
    ISession,
    Session
} from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";


/**
 * This class is used by the various zosfiles handlers as the base class for their implementation.
 * All handlers within zosfiles should extend this class.
 *
 * This class should not be used outside of the zosfiles package.
 *
 * @private
 */
export abstract class ZosFilesBaseHandler implements ICommandHandler {
    /**
     * This will grab the zosmf profile and create a session before calling the subclass
     * {@link ZosFilesBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(commandParameters: IHandlerParameters) {
        const sessCfg: ISession = ZosmfSession.createSessCfgFromArgs(
            commandParameters.arguments
        );
        const sessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            sessCfg, commandParameters.arguments, {parms: commandParameters}
        );
        const session = new Session(sessCfgWithCreds);
        try {
            const response = await this.processWithSession(commandParameters, session);

            commandParameters.response.progress.endBar(); // end any progress bars

            // Print out the response
            if (response.commandResponse) {
                commandParameters.response.console.log(response.commandResponse);
            }

            // Return as an object when using --response-format-json
            commandParameters.response.data.setObj(response);

            // Ensure error gets thrown if request was unsuccessful
            // Sometimes it is useful to delay throwing an error until the end of the handler is
            // reached, for example the upload API needs to return an API response even when it fails.
            if (!response.success && response.commandResponse) {
                throw new ImperativeError({
                    msg: response.errorMessage || response.commandResponse
                });
            }
        } catch (error) {
            // Check if --quiet flag is present
            if (commandParameters.arguments.quiet && this.isFileNotFoundError(error)) {
                // Suppress errors for missing files when --quiet is used
                return;
            }
            // Re-throw the error for other cases
            throw error;
        }
    }

    /**
     * Helper method to check if an error is related to a file not being found (404)
     *
     * @param error The error object to check
     * @returns {boolean} true if the error indicates the file was not found (404)
     */
    private isFileNotFoundError(error: any): boolean {
        return error && error.response && error.response.status === 404;
    }

    /**
     * This is called by the {@link ZosFilesBaseHandler#process} after it creates a session. Should
     * be used so that every class under files does not have to instantiate the session object.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler.
     * @param {AbstractSession} session The session object generated from the zosmf profile.
     *
     * @returns {Promise<IZosFilesResponse>} The response from the underlying zos-files api call.
     */
    public abstract processWithSession(
        commandParameters: IHandlerParameters,
        session: AbstractSession,
    ): Promise<IZosFilesResponse>;
}
