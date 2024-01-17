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
import { Constants } from "../../../constants";
import { ICommandDefinition } from "../../../cmd";
import {
    deleteProfileActionDesc,
    deleteProfileCommandDesc,
    deleteProfileExample,
    deleteProfileForceOptionDesc,
    deleteProfileNameDesc
} from "../../../messages/index";
import { ImperativeConfig, TextUtils } from "../../../utilities";
import { ProfilesConstants, ProfileUtils } from "../../../profiles";

/**
 * Used to build delete profile command definitions.
 * Used automatically if you allow the "profiles" command group to be generated
 */
export class ProfilesDeleteCommandBuilder extends ProfilesCommandBuilder {

    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The "create" action string
     */
    public getAction(): string {
        return Constants.DELETE_ACTION;
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
            summary: TextUtils.formatMessage(deleteProfileActionDesc.message,
                {type: this.mProfileType}),
            description: TextUtils.formatMessage(deleteProfileCommandDesc.message,
                {type: this.mProfileType}),
            type: "command",
            handler: __dirname + "/../handlers/NewDeleteProfilesHandler",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_EDIT +
                "\n    " + ImperativeConfig.instance.config.formMainConfigPathNm({addPath: false}),
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
            }],
            examples: [
                {
                    options: "profilename",
                    description: TextUtils.formatMessage(deleteProfileExample.message,
                        {
                            type: this.mProfileType,
                            name: "profilename"
                        })
                }
            ]
        };
        profileCommand.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY] = this.mProfileType;

        profileCommand.options.push({
            name: "force",
            aliases: [],
            description: TextUtils.formatMessage(deleteProfileForceOptionDesc.message,
                {
                    type: this.mProfileType,
                    typeOption: ProfileUtils.getProfileOption(this.mProfileType)
                }),
            type: "boolean",
            required: false,
        });

        return profileCommand;
    }
}
