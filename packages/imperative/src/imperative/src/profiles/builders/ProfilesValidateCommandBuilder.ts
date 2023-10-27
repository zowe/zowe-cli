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
import { ICommandDefinition, ICommandProfileTypeConfiguration } from "../../../../cmd";
import { Constants } from "../../../../constants";
import { deleteProfileNameDesc, validateProfileCommandDesc } from "../../../../messages";
import { ImperativeConfig, TextUtils } from "../../../../utilities";
import { Logger } from "../../../../logger/index";
import { isNullOrUndefined } from "util";
import { ProfilesConstants, ProfileUtils, ProfileValidator } from "../../../../profiles";

/**
 * Used to build profile validate command definitions.
 * Used automatically if you allow the "profiles" command group to be generated
 */
export class ProfilesValidateCommandBuilder extends ProfilesCommandBuilder {

    /**
     * Construct the builder based on the schema.
     * @param profileType - the name of the profile type to build the command for
     * @param {Logger} logger - logger to use while building command definition
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
        return Constants.VALIDATE_ACTION;
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
        if (isNullOrUndefined(this.mProfileConfig.validationPlanModule)) {
            return undefined;
        }
        const profileCommand: ICommandDefinition = {
            name: this.mProfileType + "-profile",
            aliases: [this.mProfileType],
            summary: TextUtils.formatMessage(validateProfileCommandDesc.message,
                {type: this.mProfileType}),
            description: TextUtils.formatMessage(validateProfileCommandDesc.message,
                {type: this.mProfileType}),
            type: "command",
            handler: __dirname + "/../handlers/ValidateProfileHandler",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_EDIT +
                "\n    " + ImperativeConfig.instance.config.formMainConfigPathNm({addPath: false}),
            customize: {},
            options: [ProfileValidator.PRINT_PLAN_OPTION],
            positionals: [{
                name: Constants.PROFILE_NAME_OPTION,
                description: TextUtils.formatMessage(deleteProfileNameDesc.message,
                    {
                        type: this.mProfileType,
                        typeOption: ProfileUtils.getProfileOption(this.mProfileType)
                    }),
                type: "string",
                required: false
            }]
        };
        profileCommand.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY] = this.mProfileType;


        return profileCommand;
    }
}
