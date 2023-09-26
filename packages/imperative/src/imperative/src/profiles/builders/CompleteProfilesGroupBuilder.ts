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

import { ICommandDefinition } from "../../../../cmd";
import {
    createProfilesCommandDesc, createProfilesCommandSummary,
    deleteProfilesCommandDesc, deleteProfilesCommandSummary,
    listProfileCommandDesc, listProfileCommandSummary,
    setProfileActionDesc, setProfileActionSummary,
    updateProfileCommandDesc, updateProfileCommandSummary,
    validateProfileGroupDesc, validateProfileCommandSummary
} from "../../../../messages";
import { Constants } from "../../../../constants";
import { ProfilesCreateCommandBuilder } from "./ProfilesCreateCommandBuilder";
import { ProfilesUpdateCommandBuilder } from "./ProfilesUpdateCommandBuilder";
import { ProfilesDeleteCommandBuilder } from "./ProfilesDeleteCommandBuilder";
import { ProfilesValidateCommandBuilder } from "./ProfilesValidateCommandBuilder";
import { ProfilesListCommandBuilder } from "./ProfilesListCommandBuilder";
import { ProfilesSetCommandBuilder } from "./ProfilesSetCommandBuilder";
import { Logger } from "../../../../logger/index";
import { IProfileTypeConfiguration, ProfilesConstants } from "../../../../profiles";
import { ImperativeConfig } from "../../../../utilities";

/**
 * Generate a complete group of commands for maintaining configuration profiles
 * based on provided profile definitions.
 */
export class CompleteProfilesGroupBuilder {


    /**
     * Get the complete profile group of commands
     * @param {ICommandProfileTypeConfiguration[]} profiles - the profile configurations to convert to commands
     * @param {Logger} logger - logger to use in the builder classes
     * @returns {ICommandDefinition} - the complete profile group of commands
     */
    public static getProfileGroup(profiles: IProfileTypeConfiguration[], logger: Logger): ICommandDefinition {

        const profileGroup: ICommandDefinition = {
            name: Constants.PROFILE_GROUP,
            description: "Create and manage configuration profiles.",
            type: "group",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_INIT,
            children: []
        };

        const createGroup: ICommandDefinition = {
            name: Constants.CREATE_ACTION,
            description: createProfilesCommandDesc.message,
            summary: createProfilesCommandSummary.message,
            aliases: ["cre"],
            type: "group",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_INIT,
            children: [],
        };

        const deleteGroup: ICommandDefinition = {
            name: Constants.DELETE_ACTION,
            description: deleteProfilesCommandDesc.message,
            summary: deleteProfilesCommandSummary.message,
            aliases: ["rm"],
            type: "group",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_EDIT + " " +
                ImperativeConfig.instance.config.formMainConfigPathNm({addPath: false}),
            children: [],
        };

        const setGroup: ICommandDefinition = {
            name: Constants.SET_ACTION,
            summary: setProfileActionSummary.message,
            description: setProfileActionDesc.message,
            type: "group",
            aliases: ["set"],
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_SET,
            children: [],
        };

        const updateGroup: ICommandDefinition = {
            name: Constants.UPDATE_ACTION,
            description: updateProfileCommandDesc.message,
            summary: updateProfileCommandSummary.message,
            aliases: ["upd"],
            type: "group",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_SET,
            children: [],
        };

        const validateGroup: ICommandDefinition = {
            name: Constants.VALIDATE_ACTION,
            description: validateProfileGroupDesc.message,
            summary: validateProfileCommandSummary.message,
            aliases: ["val"],
            type: "group",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_EDIT + " " +
                ImperativeConfig.instance.config.formMainConfigPathNm({addPath: false}),
            children: [],
        };

        const listGroup: ICommandDefinition = {
            name: Constants.LIST_ACTION,
            description: listProfileCommandDesc.message,
            summary: listProfileCommandSummary.message,
            aliases: ["ls"],
            type: "group",
            deprecatedReplacement: ProfilesConstants.DEPRECATE_TO_CONFIG_LIST,
            children: [],
        };

        for (const profile of profiles) {
            const createCommandAction = new ProfilesCreateCommandBuilder(profile.type, logger, profile);
            const updateCommandAction = new ProfilesUpdateCommandBuilder(profile.type, logger, profile);
            const deleteCommandAction = new ProfilesDeleteCommandBuilder(profile.type, logger, profile);
            const validateCommandAction = new ProfilesValidateCommandBuilder(profile.type, logger, profile);
            const listCommandAction = new ProfilesListCommandBuilder(profile.type, logger, profile);
            const setCommandAction = new ProfilesSetCommandBuilder(profile.type, logger, profile);
            updateGroup.children.push(updateCommandAction.build());
            deleteGroup.children.push(deleteCommandAction.build());
            // validate profile is optional depending on if the profile has a validation plan
            const validateCommandResult = validateCommandAction.build();
            if (validateCommandResult != null) {
                validateGroup.children.push(validateCommandResult);
            }
            listGroup.children.push(listCommandAction.build());
            createGroup.children.push(createCommandAction.build());
            setGroup.children.push(setCommandAction.build());
        }
        profileGroup.children.push(createGroup, updateGroup, deleteGroup, listGroup, setGroup);
        if (validateGroup.children.length > 0) {
            // don't bother to add validation commands unless some plans have been provided
            profileGroup.children.push(validateGroup);
        }
        return profileGroup;
    }
}
