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
import { isNullOrUndefined } from "util";
import { Constants } from "../../../constants";
import { ICommandDefinition } from "../../../cmd";
import { createProfileOptionDesc, updateProfileCommandDesc } from "../../../messages";
import { TextUtils } from "../../../utilities";
import { IProfileProperty, ProfilesConstants, ProfileUtils } from "../../../profiles";
import { ICommandProfileProperty } from "../../../cmd/doc/profiles/definition/ICommandProfileProperty";

/**
 * Used to build profile update command definitions.
 * Used automatically if you allow the "profiles" command group to be generated
 */
export class ProfilesUpdateCommandBuilder extends ProfilesCommandBuilder {

    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The "create" action string
     */
    public getAction(): string {
        return Constants.UPDATE_ACTION;
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

        // clone the properties file before trying to modify them so that we don't affect the original
        const updateOnlyProperties: { [key: string]: IProfileProperty } =
            JSON.parse(JSON.stringify(this.mSchema.properties));
        for (const propName of Object.keys(updateOnlyProperties)) {
            // helper to tweak all nested option definitions
            // for updating the profile (marking required options
            // optional in case the user does not wish to update them)
            const processFieldsForUpdate = (properties: any, propertyName: string) => {
                const field: ICommandProfileProperty = properties[propertyName];
                if (!isNullOrUndefined(field.optionDefinition)) {
                    field.optionDefinition.required = false;
                    field.optionDefinition.absenceImplications = null;
                    field.optionDefinition.implies = null;
                }
                if (!isNullOrUndefined(field.optionDefinitions)) {
                    for (const anOption of field.optionDefinitions) {
                        if (!isNullOrUndefined(anOption.required)) {
                            anOption.required = false;
                            anOption.absenceImplications = null;
                            anOption.implies = null;
                        }
                    }
                }
                if (field.properties != null) {
                    for (const nestedProperty of Object.keys(field.properties)) {
                        processFieldsForUpdate(field.properties, nestedProperty);
                    }
                }
            };
            processFieldsForUpdate(updateOnlyProperties, propName);
        }
        const profileCommand: ICommandDefinition = {
            name: this.mProfileType + "-profile",
            aliases: [this.mProfileType],
            summary: TextUtils.formatMessage(updateProfileCommandDesc.message,
                {type: this.mProfileType}),
            description: this.mSchema.description,
            type: "command",
            handler: __dirname + "/../handlers/UpdateProfilesHandler",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_SET,
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
            options: this.buildOptionsFromProfileSchema(updateOnlyProperties, []),
        };
        profileCommand.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY] = this.mProfileType;

        if (this.mProfileConfig.updateProfileExamples != null) {
            profileCommand.examples = this.mProfileConfig.updateProfileExamples;
        }

        // We don't want to override existing settings with defaultValue for an option
        for (const option of profileCommand.options) {
            delete option.defaultValue;
        }
        return profileCommand;
    }
}
