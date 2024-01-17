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

// // import { isNullOrUndefined } from "util";
// import { CommandResponse, ICommandHandler, IHandlerParameters } from "../../../../cmd";
// import { Constants } from "../../../../constants";
// import { ProfileManager } from "../../ProfileManager";
// import {
//     profileDeletedSuccessfully,
//     profileDeleteErrorDetails,
//     profileDeleteErrorHeader,
//     profileNotDeletedMessage,
//     unableToDeleteProfile,
//     unableToFindProfile
// } from "../../../../messages";
// import { TextUtils } from "../../../../utilities";
// import { IProfileDeleted } from "../../doc/response/IProfileDeleted";
// import { IProfile } from "../../../index";
// import { IProfileLoaded } from "../../doc/response/IProfileLoaded";
// import { Imperative } from "../../../../index";
// import { ProfileUtils } from "../../ProfileUtils";
// import { ProfilesConstants } from "../../constants/ProfilesConstants";

// /**
//  * Handler for the auto-generated delete profiles command.
//  * Deletes requested user configuration profiles
//  */
// export default class DeleteProfilesHandler implements ICommandHandler {
//     private rejectCommand: any;
//     private response: CommandResponse;

//     /**
//      * The process command handler for the "delete profile" command.
//      * @return {Promise<ICommandResponse>}: The promise to fulfill when complete.
//      */
//     public process(commandParameters: IHandlerParameters): Promise<void> {

//         /**
//          * Invoke the modules profile creator.
//          */
//         const errors: string[] = [];
//         const shouldForce: boolean = commandParameters.arguments.force;
//         const profileList: Map<string, IProfile[]> = new Map<string, IProfile[]>();
//         const profileType = commandParameters.definition.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY];
//         const profileSpecified: string = commandParameters.arguments[Constants.PROFILE_NAME_OPTION];

//         let loadedProfile: IProfile;
//         return new Promise<void>((commandComplete, rejectCommand) => {
//             this.rejectCommand = rejectCommand;
//             new ProfileManager(profileType)
//                 .loadProfile({ name: profileSpecified }).then((profileResponse) => {
//                     loadedProfile = profileResponse.profile;
//                     profileList.set(profileType, [loadedProfile]);
//                     const loadPromises: Array<Promise<IProfileLoaded>> = [];
//                     if (!isNullOrUndefined(loadedProfile.dependencies) &&
//                         commandParameters.arguments[Constants.PROFILE_DELETE_PROFILE_DEPS]) {
//                         for (const entry of loadedProfile.dependencies) {
//                             const loadPromise: Promise<IProfileLoaded> =
//                                 new ProfileManager({
//                                     type: profileType,
//                                     allTypeConfigs: Imperative.loadedConfig.profiles,
//                                     profileDir: ProfileUtils.constructProfilesDir()
//                                 }).loadProfile({ name: entry.name });
//                             loadPromises.push(loadPromise);
//                             loadPromise.then((profileDeleteResponse) => {
//                                 if (isNullOrUndefined(profileList.get(entry.name))) {
//                                     profileList.set(entry.type, [profileDeleteResponse.profile]);
//                                 } else {
//                                     profileList.set(entry.type, profileList.get(entry.type)
//                                         .concat(profileDeleteResponse.profile));
//                                 }
//                                 // if (profileDeleteResponse.success) {
//                                 //     if (isNullOrUndefined(profileList.get(entry.name))) {
//                                 //         profileList.set(entry.type, [profileDeleteResponse.profile]);
//                                 //     }
//                                 //     else {
//                                 //         profileList.set(entry.type, profileList.get(entry.type)
//                                 //             .concat(profileDeleteResponse.profile));
//                                 //     }
//                                 // }
//                                 // else {
//                                 //     errors.push("Could not load the dependent profile " + entry.name +
//                                 //         " from module " + entry.type);
//                                 // }
//                             }).catch((loadErr) => {
//                                 rejectCommand(loadErr);
//                             });
//                         }
//                     }
//                 }
//                 Promise.all(loadPromises).then((values) => {
//                     if (!shouldForce) {
//                         this.displayPrompts(profileList, commandParameters, errors);
//                     }
//                     else {
//                         this.deleteWithoutPrompts(profileList, commandParameters, errors);
//                     }
//                 });
//             }).catch((loadErr) => {
//                 // if (shouldForce) {
//                 //     if (!isNullOrUndefined(profileResponse.profile)) {
//                 //         profileList.set(profileType, [profileResponse.profile]);
//                 //         this.deleteWithoutPrompts(profileList, commandParameters, errors);
//                 //     } else {
//                 //         commandParameters.response.writeErrorHeader(profileDeleteErrorHeader.message);
//                 //         commandParameters.response.console.error(
//                 //             unableToFindProfile.message, profileResponse.message);
//                 //         commandParameters.response.console.error("Manual remediation is recommended.");
//                 //         commandParameters.response.failed();
//                 //     }
//                 // }
//                 // else {
//                 commandParameters.response.appendError({
//                     msg: loadErr.message,
//                     additionalDetails: "You can use the --force operand to " +
//                     "force deletion of the profile in error."
//                 });
//                 this.rejectCommand();
//                 // }
//             });
//         });
//     }

//     private deleteWithoutPrompts(profileList: Map<string, IProfile[]>, commandParameters: IHandlerParameters,
//         errors: string[]) {
//         const profileModule = new ProfileManager(commandParameters.definition.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY]);
//         const deletePromises: Array<Promise<IProfileDeleted>> = [];
//         const successes: string[] = [];
//         profileList.forEach((profiles, module, map) => {
//             for (const profileEntry of profiles) {
//                 const profile: IProfile = profileEntry;
//                 const deleteOp: Promise<IProfileDeleted> = profileModule.deleteProfile({profile});
//                 deletePromises.push(deleteOp);
//                 deleteOp.then((profileDeleted) => {
//                     /**
//                      * TODO: Work this out with the new promise scheme
//                      */
//                     // if (profileDeleted.success) {
//                     //     // mLogger.trace(`Successfully deleted profile ${profile.profileName}`);
//                     //     successes.push(profile.name);
//                     // }
//                     // else {
//                     //     //  mLogger.trace(`Failed to delete the profile ${profile.profileName}`);
//                     //     errors.push(`Error deleting profile ${profileDeleted.profilePath}.`);
//                     // }
//                 });
//             }
//         });
//         Promise.all(deletePromises).then((values) => {

//             if (errors.length === 0 && successes.length > 0) {
//                 commandParameters.response.console.log(
//                     profileDeletedSuccessfully.message, successes.join());
//             }
//             else if (errors.length === 0 && successes.length === 0) {
//                 commandParameters.response.console.log(profileNotDeletedMessage.message);
//             }
//             else {
//                 commandParameters.response.appendError({
//                     msg: unableToDeleteProfile.message,
//                     additionalDetails: TextUtils.formatMessage(
//                         profileDeleteErrorDetails.message,
//                         {errorDetails: errors.join("\n")})
//                 });
//                 this.rejectCommand();
//             }
//         });
//     }

//     private displayPrompts(profileList: Map<string, IProfile[]>, commandParameters: IHandlerParameters,
//                            errors: string[]) {
//         const prompt: any = require("prompt");
//         prompt.message = "Attention";
//         let profileCount: number = 0;
//         const successes: string[] = [];

//         const profileType = commandParameters.definition.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY];
//         const profileManager = new ProfileManager(profileType);
//         const deletePromises: Array<Promise<IProfileDeleted>> = [];
//         profileList.forEach((profiles, module, map) => {
//             for (const profileEntry of profiles) {
//                 const theProfile: IProfile = profileEntry;
//                 const promptSchema = {
//                     properties: {
//                         deleteConfirmation: {
//                             description: `Please confirm deletion of the profile` +
//                             ` "${theProfile.name}". This action cannot be undone. (true/false)`,
//                             type: "boolean",
//                             pattern: /^[YyNn]+$/,
//                             message: "Please enter true or false to confirm the profile deletion.",
//                             required: true
//                         }
//                     }
//                 };
//                 prompt.start();
//                 prompt.get(promptSchema, (err: any, result: any) => {
//                     //    this.mLogger.debug("User entered " + result.deleteConfirmation + " for the profile " + profile.profileName);
//                     if (result.deleteConfirmation === true) {
//                         // const deleteOp: Promise<IProfileDeleted> = profileManager.deleteProfile(profile);
//                         const deleteOp: Promise<IProfileDeleted> = profileManager.deleteProfile({
//                             profile: theProfile
//                         });
//                         deletePromises.push(deleteOp);
//                         deleteOp.then((profileDeleted) => {
//                             /**
//                              * TODO: work this out with the new promise scheme
//                              */
//                             // if (profileDeleted.success) {
//                             //     // mLogger.trace(`Successfully deleted profile ${profile.profileName}`);
//                             //     successes.push(profile.name);
//                             // }
//                             // else {
//                             //     //  mLogger.trace(`Failed to delete the profile ${profile.profileName}`);
//                             //     errors.push(`Error deleting profile ${profileDeleted.profilePath}.`);
//                             // }
//                         });
//                         Promise.all([deleteOp]).then((values) => {
//                             // do nothing
//                         });
//                         profileCount++;
//                     }
//                     else {
//                         profileCount++;
//                     }

//                     if (profileCount === profileList.get(profileType).length) {
//                         Promise.all(deletePromises).then((values) => {

//                             if (errors.length === 0 && successes.length > 0) {
//                                 commandParameters.response.console.log(profileDeletedSuccessfully.message, successes.join());
//                             }
//                             else if (errors.length === 0 && successes.length === 0) {
//                                 commandParameters.response.console.log(profileNotDeletedMessage.message);
//                             }
//                             else {
//                                 commandParameters.response.appendError({
//                                     msg: unableToDeleteProfile.message,
//                                     additionalDetails: TextUtils.formatMessage(
//                                         profileDeleteErrorDetails.message,
//                                         {errorDetails: errors.join("\n")})
//                                 });
//                                 this.rejectCommand();
//                             }
//                         });
//                         prompt.stop();
//                     }
//                 });
//             }
//         });
//     }
// }

