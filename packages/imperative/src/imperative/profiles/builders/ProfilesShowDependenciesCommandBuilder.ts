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

import { ProfilesCommandBuilder } from "./ProfilesCommandBuilder";
import { Constants } from "../../../../src/constants";
import { ICommandDefinition } from "../../../../src/cmd";
import { deleteProfileNameDesc, showDependenciesCommandDesc } from "../../../../src/messages";
import { TextUtils } from "../../../../src/utilities";
import { ProfilesConstants, ProfileUtils } from "../../../../src/profiles";

/**
 * Used to build profile create command definitions.
 * Used automatically if you allow the "profiles" command group to be generated
 */
export class ProfilesShowDependenciesCommandBuilder extends ProfilesCommandBuilder {

    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The "create" action string
     */
    public getAction(): string {
        return Constants.SHOW_DEPS_ACTION;
    }

    /**
     * Build the full command - includes action group and object command.
     * @return {ICommandDefinition}: The command definition.
     */
    public buildFull(): ICommandDefinition {
        return this.buildProfileSegmentFromSchema();
    }

    /**
     * Builds only the "profile" segment from the profile schema.
     * @return {ICommandDefinition}
     */
    protected buildProfileSegmentFromSchema(): ICommandDefinition {
        const profileCommand: ICommandDefinition = {
            name: this.mProfileType + "-profile",
            aliases: [this.mProfileType],
            summary: TextUtils.formatMessage(showDependenciesCommandDesc.message,
                {type: this.mProfileType}),
            description: this.mSchema.description,
            type: "command",
            handler: __dirname + "/../handlers/ShowDependenciesProfilesHandler",
            customize: {},
            options: [],
            positionals: [{
                name: Constants.PROFILE_NAME_OPTION,
                description: TextUtils.formatMessage(deleteProfileNameDesc.message,
                    {
                        type: this.mProfileType,
                        typeOption: ProfileUtils.getProfileOption(this.mProfileType)
                    }),
                type: "string",
                required: true,
            }]
        };
        profileCommand.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY] = this.mProfileType;

        return profileCommand;
    }
}
