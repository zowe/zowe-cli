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
import { IHandlerParameters } from "../../../cmd/doc/handler/IHandlerParameters";
import { Constants } from "../../../constants";
import { IProfileDeleted, ProfilesConstants } from "../../../profiles";

export default class NewDeleteProfilesHandler {
    public async process(commandParameters: IHandlerParameters) {
        const profileType = commandParameters.definition.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY];
        const profileName: string = commandParameters.arguments[Constants.PROFILE_NAME_OPTION];
        let deleted: IProfileDeleted;

        try {
            deleted = await Imperative.api.profileManager(profileType).delete({
                name: profileName,
                rejectIfDependency: !commandParameters.arguments.force || false
            });
        } catch (error) {
            // profileIO error is thrown when calling old profile functions in team config mode.
            commandParameters.response.console.error(
                "An error occurred trying to delete a profile.\n" + error.message
            );
            return;
        }

        if (!deleted.defaultCleared) {
            commandParameters.response.console.log(`Your profile named ${profileName} of type ${profileType} was successfully deleted.`);
        } else {
            commandParameters.response.console.log(`Your default profile named ${profileName} of type ${profileType} was successfully deleted.\n` +
                `Because you deleted it, the default profile for type ${profileType} has been cleared.\nTo set a new default profile, run "zowe ` +
                `profiles set-default ${profileType} <profileName>".`);
        }
    }
}
