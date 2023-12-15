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

import { IMessageDefinition } from "./doc/IMessageDefinition";
import { Constants } from "../../constants";

export const apiErrorHeader: IMessageDefinition = {
    message: `${Constants.FRAMEWORK_DISPLAY_NAME} API Error`
};

export const couldNotInstantiateCommandHandler: IMessageDefinition = {
    message: `Could not instantiate the handler {{commandHandler}} for ` +
        `command {{definitionName}}`
};

export const errorDetailsHeader: IMessageDefinition = {
    message: "Error Details:"
};

export const unexpectedCommandError: IMessageDefinition = {
    message: "Unexpected Command Error"
};

export const unexpectedCommandPreparationError: IMessageDefinition = {
    message: "An unexpected command preparation error occurred:"
};

export const unableToLoadRequestedProfilesError: IMessageDefinition = {
    message: "Command processing cannot continue: Unable to load requested or default profiles."
};

export const unexpectedProfileLoadError: IMessageDefinition = {
    message: "An unexpected profile load error occurred:"
};

export const profileLoadError: IMessageDefinition = {
    message: `Error loading {{type}} profile: {{profileName}}.\n\n` +
        `Additional Details:\n\n`
};

export const unexpectedProfilesLoadError: IMessageDefinition = {
    message: "An unexpected error occurred while loading requested profiles:\n"
};

export const syntaxErrorHeader: IMessageDefinition = {
    message: `\nSyntax Error`
};

export const createProfilesCommandSummary: IMessageDefinition = {
    message: `Create new configuration profiles`,
};

export const createProfilesCommandDesc: IMessageDefinition = {
    message: `${createProfilesCommandSummary.message}.`,
};

export const createProfileCommandSummary: IMessageDefinition = {
    message: `Create a {{type}} profile`,
};

export const createProfileCommandDesc: IMessageDefinition = { //TODO: Currently unused
    message: `${createProfileCommandSummary.message}.`,
};

export const createProfileOptionDesc: IMessageDefinition = {
    message: `Specifies the name of the new {{type}} profile. ` +
        `You can load this profile by using the name on commands that support the ` +
        `"--{{type}}-profile" option.`
};

export const listProfileLoadedModulesOptionDesc: IMessageDefinition = {
    message: `List {{type}} ` +
        ` profiles that are loaded as part of normal command execution. ` +
        `This will show you the default profiles being loaded.`
};

export const listProfileVerboseOptionDesc: IMessageDefinition = {
    message: `List {{type}} ` +
        ` profiles  and their contents. ` +
        `All profile details will be printed as part of command output.`
};

export const listProfileExample: IMessageDefinition = {
    message: `List profiles of type {{type}}`
};

export const listProfileExampleShowContents: IMessageDefinition = {
    message: `List profiles of type {{type}} and display their contents`
};

export const deleteProfileNameDesc: IMessageDefinition = {
    message: `Specifies the name of the {{type}} ` +
        ` profile to be deleted. ` +
        `You can also load this profile by using the name on commands that support the ` +
        `"--{{typeOption}}" option.`
};


export const deleteProfileExample: IMessageDefinition = {
    message: `Delete a {{type}} profile named {{name}}`
};


export const validateProfileNameDesc: IMessageDefinition = {
    message: `Specifies the name of the {{type}} ` +
        ` profile to be validated. ` +
        `If the --print-plan-only option is specified, then only a plan to validate the specified profile will be displayed.`
};


export const selectProfileNameDesc: IMessageDefinition = {
    message: `Specifies the name of the {{type}} ` +
        `
 profile to be used with this command. ` +
        `To see profiles that can be validated, issue the list action for this module. ` +
        `You can also load this profile by using the name on commands that support the ` +
        `"--{{typeOption}}" option.`
};


export const createProfileOptionOverwriteDesc: IMessageDefinition = {
    message: `Overwrite the {{type}} profile when a profile of the same name exists.`
};

export const createProfileDisableDefaultsDesc: IMessageDefinition = {
    message: `Disable populating profile values of undefined properties with default values.`
};

export const deleteProfilesCommandSummary: IMessageDefinition = {
    message: `Delete existing profiles`
};

export const deleteProfilesCommandDesc: IMessageDefinition = {
    message: `${deleteProfilesCommandSummary.message}.`
};

export const deleteProfileForceOptionDesc: IMessageDefinition = {
    message: `Force deletion of profile, and dependent profiles if specified. No prompt will be displayed before ` +
        `deletion occurs.`
};

export const deleteProfileActionDesc: IMessageDefinition = {
    message: `Delete a {{type}} profile.`
};

export const deleteProfileCommandDesc: IMessageDefinition = {
    message: `Delete a {{type}} profile.` +
        ` You must specify a profile name to be deleted. To find a list of available profiles for deletion,` +
        ` issue the profiles list command. By default, you will be prompted to confirm the profile removal.`,
};

export const deleteProfileDepsDesc: IMessageDefinition = {
    message: `Set to true to delete all dependent profiles along with the {{type}} profile.` +
        `If set to true, a list of dependent profiles will be shown along with a confirmation prompt before the ` +
        `deletions occur. If set to false, only the {{type}} profile specified will be deleted.`
};

export const showDependenciesCommandDesc: IMessageDefinition = {
    message: `View all profiles which may be used within a selected group.`,
};

export const listProfileCommandSummary: IMessageDefinition = {
    message: `List existing profiles`,
};

export const listProfileCommandDesc: IMessageDefinition = {
    message: `List profiles of the type {{type}}.`,
};

export const listProfilesFoundMessage: IMessageDefinition = {
    message: `The following profiles were found of the type "{{type}}":`,
};

export const listProfilesNotFoundMessage: IMessageDefinition = {
    message: `No profiles were found of the type "{{type}}".`,
};

export const validateProfileCommandSummary: IMessageDefinition = {
    message: `Test the validity of a profile`,
};

export const validateProfileGroupDesc: IMessageDefinition = {
    message: `Test the validity of your profiles.`,
};
export const validateProfileCommandDesc: IMessageDefinition = {
    message: `Test the validity of a {{type}} profile.`,
};

export const validateProfileOptionDesc: IMessageDefinition = {
    message: `Validate the state of a group.`,
};

export const detailProfileCommandDesc: IMessageDefinition = {
    message: `Show details of a profile of a selected type.`,
};
export const updateProfileActionDesc: IMessageDefinition = {
    message: `Update a {{type}} profile.`,
};

export const updateProfileCommandSummary: IMessageDefinition = {
    message: `Update existing profiles`,
};

export const updateProfileCommandDesc: IMessageDefinition = {
    message: `Update a {{type}} profile. ` +
        `You can update any property present within the profile configuration. The updated profile ` +
        `will be printed so that you can review the result of the updates.`,
};

export const listGroupWithOnlyProfilesSummary: IMessageDefinition = {
    message: `List the {{type}} profiles loaded`
};

export const listGroupWithOnlyProfilesDefinition: IMessageDefinition = {
    message: `List the {{type}} profiles loaded.`
};

export const listGroupWithOnlyProfileDefaultDesc: IMessageDefinition = {
    message: `Lists all known profiles for this command group. ` +
        `When you issue a command that requires a profile or set of ` +
        `profiles, said profiles are loaded by default (or according to override options on the command). You can use this ` +
        `command to review your configured profiles, and verify your default profile set.`
};

export const listGroupWithOnlyProfileCommandSummary: IMessageDefinition = {
    message: `List {{type}} loaded  profiles`
};

export const listGroupWithOnlyProfileSetDesc: IMessageDefinition = {
    message: `To set the default profiles, use the " ` +
        `{{type}} ${Constants.DEFAULT_SET_GROUP} ${Constants.DEFAULT_SET_PROFILE_OBJECT}" command.`
};

export const setProfileActionSummary: IMessageDefinition = {
    message: `Set which profiles are loaded by default`
};

export const setProfileActionDesc: IMessageDefinition = {
    message: `${setProfileActionSummary.message}.`
};

export const setGroupWithOnlyProfilesSummary: IMessageDefinition = {
    message: `Set the default profiles for the {{type}} group`
};

export const setGroupWithOnlyProfilesCommandDesc: IMessageDefinition = {
    message: `The {{type}} set ${Constants.DEFAULT_SET_PROFILE_OBJECT} command allows you to set the default profiles for ` +
        `this command group. When a {{type}} command is issued and no profile override options are ` +
        `specified, the default profiles for the command group are automatically loaded for the command based on the ` +
        `commands profile requirements.`
};

export const setProfileOptionDesc: IMessageDefinition = {
    message: `Specify a
 profile for default usage within the {{type}} group. ` +
        `When you issue commands within the {{type}} group without a profile specified as part of the command, the default ` +
        `will be loaded instead.`
};

export const setProfileExample: IMessageDefinition = {
    message: `Set the default profile for type {{type}} to the profile named '{{name}}'`
};

export const setGroupWithOnlyProfilesListDesc: IMessageDefinition = {
    message: `To view the default profiles, use the " ` +
        `{{type}} ${Constants.DEFAULT_LIST_GROUP} ${Constants.DEFAULT_LIST_PROFILE_OBJECT}" command.`
};


export const profileCreatedSuccessfullyAndPath: IMessageDefinition = {
    message: `Profile created successfully! Path:`
};

export const profileUpdatedSuccessfullyAndPath: IMessageDefinition = {
    message: `Profile updated successfully! Path:`
};

export const profileReviewMessage: IMessageDefinition = {
    message: "Review the created profile and edit if necessary using the profile update command."
};

export const profileCreateErrorHeader: IMessageDefinition = {
    message: "Profile Create Error"
};

export const unableToCreateProfile: IMessageDefinition = {
    message: "Unable to create the requested profile."
};

export const profileCreateErrorDetails: IMessageDefinition = {
    message: "Error Details: {{errorDetails}}"
};
export const profileNotDeletedMessage: IMessageDefinition = {
    message: "No profiles were deleted."
};

export const profileDeletedSuccessfully: IMessageDefinition = {
    message: "Successfully deleted the following profile(s): "
};

export const profileDeleteErrorHeader: IMessageDefinition = {
    message: "Profile Deletion Error"
};

export const unableToDeleteProfile: IMessageDefinition = {
    message: "Not all requested profiles could be deleted."
};

export const unableToFindProfile: IMessageDefinition = {
    message: "Could not find or load the supplied profile name. Error details: "
};

export const profileDeleteErrorDetails: IMessageDefinition = {
    message: "Error Details: {{errorDetails}}"
};

export const overroteProfileMessage: IMessageDefinition = {
    message: "Overwrote existing profile for {{profileOption}}."
};

export const profileDesc: IMessageDefinition = {
    message: `Configuration profiles are loaded based on the requirements ` +
        `of the command:`
};

export const locateProfilesDesc: IMessageDefinition = {
    message: `Configuration profiles are located and used by searching in the following order,` +
        ` ending the search when a profile is found:`
};

export const profileCreatedSuccessfully: IMessageDefinition = {
    message: `Profile created successfully.`
};

export const unexpectedProfileCreationError: IMessageDefinition = {
    message: `An unexpected profile creation error occurred: \n{{unexpectedError}}`
};

export const unexpectedProfileUpdateError: IMessageDefinition = {
    message: `An unexpected profile update error occurred: \n{{unexpectedError}}`
};

export const authCategoryDesc: IMessageDefinition = {
    message: `Connect to token-based authentication services.`
};

export const authLoginGroupSummary: IMessageDefinition = {
    message: `Log in to an authentication service`
};

export const authLoginGroupDesc: IMessageDefinition = {
    message: `${authLoginGroupSummary.message}.`
};

export const authLoginCommandDesc: IMessageDefinition = {
    message: `Log in to {{type}} authentication service.`
};

export const authLoginShowTokenDesc: IMessageDefinition = {
    message: `Show the token when login is successful. If specified, does not save the token to a profile.`
};

export const authLogoutGroupSummary: IMessageDefinition = {
    message: `Log out of an authentication service`
};

export const authLogoutGroupDesc: IMessageDefinition = {
    message: `${authLogoutGroupSummary.message}.`
};

export const authLogoutCommandDesc: IMessageDefinition = {
    message: `Log out of {{type}} authentication service.`
};

export const autoInitCommandSummary: IMessageDefinition = {
    message: `Automatically generate a config from {{source}}`
};

export const autoInitCommandDesc: IMessageDefinition = {
    message: `${autoInitCommandSummary.message}.`
};
