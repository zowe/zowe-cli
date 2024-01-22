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

import { Imperative } from "../../Imperative";
import { ProfilesConstants } from "../../../profiles";
import { ICommandHandler, IHandlerParameters } from "../../../cmd";
import { Constants } from "../../../constants";
/**
 * Handler for the auto generated commands to set the default profile for a type
 * The default profile is loaded when no specific profile name is specified
 */
export default class SetDefaultProfilesHandler implements ICommandHandler {
    /**
     * process the set default profile command arguments
     * @return {Promise<ICommandResponse>}: The promise to fulfill when complete.
     */
    public process(commandParameters: IHandlerParameters): Promise<void> {
        return new Promise<void>((commandComplete, commandRejected) => {
            /**
             * Get the loaded module for the command being issued and set the default profile.
             */
            const profileType: string = commandParameters.definition.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY];
            const profileSpecified: string = commandParameters.arguments[Constants.PROFILE_NAME_OPTION];
            let invoked: boolean = false;
            try {
                Imperative.api.profileManager(profileType).setDefault(profileSpecified);
                commandParameters.response.console.log(`The default profile for ${profileType} set to ` +
                    `${profileSpecified}`);
            } catch (error) {
                const err: string = `Error occurred while setting default profile for ` +
                    `${profileType}.\n${error.message}`;
                commandParameters.response.console.error(err);
                invoked = true;
                commandRejected();
            }

            // Fulfill the promise
            if (!invoked) {
                commandComplete();
            }
        });
    }

}
