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
import { ICommandDefinition } from "../../../../cmd";
import { TextUtils } from "../../../../utilities";
import { Constants } from "../../../../constants";
import {
    setGroupWithOnlyProfilesCommandDesc,
    setGroupWithOnlyProfilesSummary,
    setProfileExample,
    setProfileOptionDesc
} from "../../../../messages/index";
import { ProfilesConstants } from "../../../../profiles";

/**
 * Used to build "set default profile" command definitions.
 * Used automatically if you allow the "profiles" command group to be generated
 */
export class ProfilesSetCommandBuilder extends ProfilesCommandBuilder {

    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The "create" action string
     */
    public getAction(): string {
        return Constants.SET_ACTION;
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
            summary: TextUtils.formatMessage(setGroupWithOnlyProfilesSummary.message,
                {type: this.mProfileType}),
            description: TextUtils.formatMessage(setGroupWithOnlyProfilesCommandDesc.message,
                {type: this.mProfileType}),
            type: "command",
            handler: __dirname + "/../handlers/SetDefaultProfilesHandler",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_SET,
            options: [],
            positionals: [{
                name: Constants.PROFILE_NAME_OPTION,
                description: TextUtils.formatMessage(setProfileOptionDesc.message,
                    {
                        type: this.mProfileType,
                    }),
                type: "string",
                required: true,
            }],
            customize: {},
            examples: [{
                options: "profilename",
                description: TextUtils.formatMessage(setProfileExample.message, {
                    type: this.mProfileType,
                    name: "profilename"
                }),
            }
            ]
        };
        profileCommand.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY] = this.mProfileType;

        return profileCommand;
    }
}
