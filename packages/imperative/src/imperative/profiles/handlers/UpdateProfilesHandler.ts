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

import { overroteProfileMessage, profileUpdatedSuccessfullyAndPath, profileReviewMessage } from "../../../../messages";
import { Imperative } from "../../Imperative";
import { IProfileUpdated, ProfilesConstants } from "../../../../src/profiles";
import { ICommandHandler, IHandlerParameters } from "../../../../src/cmd";
import { Constants } from "../../../../src/constants";
import { TextUtils } from "../../../../src/utilities";

/**
 * Handler for the auto-generated update profile commands
 * Allows the user to simply update an existing configuration profile
 */
export default class UpdateProfilesHandler implements ICommandHandler {
    /**
     * The process command handler for the "update profile" command.
     * @return {Promise<ICommandResponse>}: The promise to fulfill when complete.
     */
    public async process(commandParameters: IHandlerParameters): Promise<void> {

        /**
         * Invoke the modules profile creator.
         */
        const profileType = commandParameters.definition.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY];
        const profileSpecified: string = commandParameters.arguments[Constants.PROFILE_NAME_OPTION];
        let profileUpdated: IProfileUpdated;

        try {
            profileUpdated = await  Imperative.api.profileManager(profileType).update({
                name: profileSpecified,
                args: commandParameters.arguments,
                merge: true
            });
        } catch (error) {
            // profileIO error is thrown when calling old profile functions in team config mode.
            commandParameters.response.console.error(
                "An error occurred trying to update a profile.\n" + error.message
            );
            return;
        }

        commandParameters.response.console.log(overroteProfileMessage.message, {
            profileOption: commandParameters.arguments[Constants.PROFILE_NAME_OPTION]
        });
        commandParameters.response.console.log(profileUpdatedSuccessfullyAndPath.message);
        commandParameters.response.console.log(profileUpdated.path);
        commandParameters.response.console.log("");
        commandParameters.response.console.log(TextUtils.prettyJson(profileUpdated.profile,
            undefined, undefined, "\n"));
        commandParameters.response.console.log(profileReviewMessage.message);

    }
}
