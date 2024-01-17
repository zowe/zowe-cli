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
import { ICommandDefinition, ICommandProfileTypeConfiguration } from "../../../cmd";
import {
    listProfileCommandDesc,
    listProfileExample,
    listProfileExampleShowContents,
    listProfileVerboseOptionDesc
} from "../../../messages";
import { TextUtils } from "../../../utilities";
import { Logger } from "../../../logger/";
import { ProfilesConstants } from "../../../profiles";

/**
 * Used to build profile update command definitions.
 * Used automatically if you allow the "profiles" command group to be generated
 */
export class ProfilesListCommandBuilder extends ProfilesCommandBuilder {
    /**
     * Construct the builder based on the schema.
     * @param profileType - the profile type to generate the command definition for
     * @param {Logger} logger - logger instance to use for the builder class
     * @param {ICommandProfileTypeConfiguration} profileConfig: Imperative profile configuration for this type of profile
     */
    constructor(profileType: string, logger: Logger, profileConfig: ICommandProfileTypeConfiguration) {
        super(profileType, logger, profileConfig);
    }

    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The "create" action string
     */
    public getAction(): string {
        return Constants.LIST_ACTION;
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
            name: this.mProfileType + "-profiles",
            aliases: [this.mProfileType],
            summary: TextUtils.formatMessage(listProfileCommandDesc.message,
                {type: this.mProfileType}),
            description: this.mSchema.description,
            type: "command",
            handler: __dirname + "/../handlers/ListProfilesHandler",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_LIST,
            customize: {},
            options: [
                {
                    name: "show-contents",
                    aliases: ["sc"],
                    description: TextUtils.formatMessage(listProfileVerboseOptionDesc.message,
                        {
                            type: this.mProfileType
                        }),
                    type: "boolean",
                    required: false
                }

            ],
            examples: [
                {
                    options: "",
                    description: TextUtils.formatMessage(listProfileExample.message,
                        {
                            type: this.mProfileType
                        }),
                },
                {
                    options: "--sc",
                    description: TextUtils.formatMessage(listProfileExampleShowContents.message,
                        {
                            type: this.mProfileType
                        }),
                }
            ]
        };
        profileCommand.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY] = this.mProfileType;
        return profileCommand;
    }
}
