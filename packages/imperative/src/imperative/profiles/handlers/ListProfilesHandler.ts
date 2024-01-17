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

import { Imperative } from "../../../";
import { ProfilesConstants } from "../../../profiles/constants/ProfilesConstants";
import { CliProfileManager, ICommandHandler, IHandlerParameters } from "../../../cmd";
import { IProfileLoaded } from "../../../";

/**
 * Handler for the auto-generated list profiles command.
 */
export default class ListProfilesHandler implements ICommandHandler {

    /**
     * The process command handler for the "list profiles" command.
     * @return {Promise<ICommandResponse>}: The promise to fulfill when complete.
     */
    public async process(params: IHandlerParameters): Promise<void> {
        let profileManager: CliProfileManager;

        // Extract the profile type
        const profileType: string = params.definition.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY];

        try {
            // Extract the profile manager
            profileManager = Imperative.api.profileManager(profileType);
        } catch (error) {
            // profileIO error is thrown when calling old profile functions in team config mode.
            params.response.console.error(
                "An error occurred trying to list profiles.\n" + error.message
            );
            return;
        }

        // Extract the default profile
        const defaultName: string = profileManager.getDefaultProfileName();

        // Load all profiles for the type contained in the manager
        const loadResults: IProfileLoaded[] = await profileManager.loadAll(
            {noSecure: true, typeOnly: true}
        );

        // Set the data object
        params.response.data.setMessage(`"${loadResults.length}" profiles loaded for type "${profileType}"`);
        params.response.data.setObj(loadResults);

        // Construct the format print list
        const print = [];
        for (const result of loadResults) {
            if (result.name === defaultName) {
                result.name += " (default) ";
            }

            print.push({
                name: result.name,
                contents: result.profile
            });

        }

        // Format the results accord to the contents
        if (params.arguments.showContents) {
            params.response.format.output({
                output: print,
                format: "object"
            });
        } else {
            params.response.format.output({
                output: print,
                fields: ["name"],
                format: "list"
            });
        }
    }
}

