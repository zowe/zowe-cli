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
import { ICommandDefinition, ICommandProfileTypeConfiguration } from "../../../cmd/doc";
import { createProfileCommandDesc, createProfileOptionDesc, createProfileOptionOverwriteDesc,
    createProfileDisableDefaultsDesc } from "../../../messages";
import { Constants } from "../../../constants";
import { TextUtils } from "../../../utils/TextUtils";
import { Logger } from "../../../logger/Logger";
import { ProfilesConstants, ProfileUtils } from "../../../profiles";

/**
 * Used to build profile create command definitions.
 * Used automatically if you allow the "profiles" command group to be generated
 */
export class ProfilesCreateCommandBuilder extends ProfilesCommandBuilder {

    /**
     * Construct the builder based on the schema.
     * @param {string} profileType - the type name for the profile
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
        return Constants.CREATE_ACTION;
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
            summary: TextUtils.formatMessage(createProfileCommandDesc.message,
                {type: this.mProfileType}),
            description: this.mSchema.description,
            type: "command",
            handler: __dirname + "/../handlers/CreateProfilesHandler",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_INIT,
            customize: {},
            positionals: [{
                name: Constants.PROFILE_NAME_OPTION,
                description: TextUtils.formatMessage(createProfileOptionDesc.message,
                    {
                        type: this.mProfileType,
                        typeOption: ProfileUtils.getProfileOption(this.mProfileType)
                    }),
                type: "string",
                required: true,
            }],
            options: this.buildOptionsFromProfileSchema(this.mSchema.properties, [])
        };
        profileCommand.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY] = this.mProfileType;
        profileCommand.options.push({
            name: Constants.OVERWRITE_OPTION, aliases: ["ow"],
            description: TextUtils.formatMessage(createProfileOptionOverwriteDesc.message,
                {type: this.mProfileType}),
            type: "boolean"
        });
        profileCommand.options.push({
            name: Constants.DISABLE_DEFAULTS_OPTION, aliases: ["dd"],
            description: TextUtils.formatMessage(createProfileDisableDefaultsDesc.message,
                {type: this.mProfileType}),
            type: "boolean"
        });

        if (this.mProfileConfig.createProfileExamples != null) {
            profileCommand.examples = this.mProfileConfig.createProfileExamples;
        }
        return profileCommand;
    }
}
