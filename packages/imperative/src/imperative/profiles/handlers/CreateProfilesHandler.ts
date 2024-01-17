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

import { overroteProfileMessage, profileCreatedSuccessfullyAndPath, profileReviewMessage } from "../../../../src/messages";
import { Imperative } from "../../Imperative";
import { IProfileSaved, ISaveProfileFromCliArgs, ProfilesConstants } from "../../../../src/profiles";
import { CliProfileManager, ICommandHandler, IHandlerParameters } from "../../../../src/cmd";

import { Constants } from "../../../../src/constants";
import { TextUtils } from "../../../../src/utilities";

/**
 * Handler that allows creation of a profile from command line arguments. Intended for usage with the automatically
 * generated profile create commands, but can be used otherwise.
 * @export
 * @class CreateProfilesHandler
 * @implements {ICommandHandler}
 */
export default class CreateProfilesHandler implements ICommandHandler {
    /**
     * Create a profile from command line arguments.
     * @param {IHandlerParameters} commandParameters - Standard Imperative command handler parameters - see the
     * interface for full details
     * @memberof CreateProfilesHandler
     */
    public async process(commandParameters: IHandlerParameters) {
        const profileType: string = commandParameters.definition.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY];
        let profileManager: CliProfileManager;

        try {
            profileManager = Imperative.api.profileManager(profileType);
        } catch (error) {
            // profileIO error is thrown when calling old profile functions in team config mode.
            commandParameters.response.console.error(
                "An error occurred trying to create a profile.\n" + error.message
            );
            return;
        }

        const profileName = commandParameters.arguments[Constants.PROFILE_NAME_OPTION];
        const createParms: ISaveProfileFromCliArgs = {
            name: profileName,
            type: profileType,
            args: commandParameters.arguments,
            overwrite: commandParameters.arguments.overwrite,
            disableDefaults: commandParameters.arguments.disableDefaults,
            profile: {}
        };
        /**
         * Create the profile based on the command line arguments passed
         */
        const createResponse: IProfileSaved = await profileManager.save(createParms);

        /**
         * Indicate to the user (if specified) that the profile was overwritten
         */
        if (createResponse.overwritten) {
            commandParameters.response.console.log(overroteProfileMessage.message, {
                profileOption: commandParameters
                    .arguments[Constants.PROFILE_NAME_OPTION]
            });
        }

        /**
         * Formulate th remainder of the response - which
         */
        commandParameters.response.console.log(profileCreatedSuccessfullyAndPath.message);
        commandParameters.response.console.log(createResponse.path);
        commandParameters.response.console.log("");
        commandParameters.response.console.log(TextUtils.prettyJson(createResponse.profile,
            undefined, undefined, "\n"));
        commandParameters.response.console.log(profileReviewMessage.message);
    }
}

