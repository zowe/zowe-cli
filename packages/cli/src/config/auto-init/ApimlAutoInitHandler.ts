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

import * as path from "path";
import * as lodash from "lodash";

import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { BaseAutoInitHandler, AbstractSession, ICommandArguments, IConfig, IConfigProfile,
    ISession, IHandlerResponseApi, IHandlerParameters, SessConstants, ImperativeConfig,
    ImperativeError, RestClientError, TextUtils
} from "@zowe/imperative";
import { IApimlProfileInfo, IAutoInitRpt, IProfileRpt, Login, Services } from "@zowe/core-for-zowe-sdk";

/**
 * This class is used by the auth command handlers as the base class for their implementation.
 */
export default class ApimlAutoInitHandler extends BaseAutoInitHandler {
    /**
     * The profile type where token type and value should be stored
     */
    protected mProfileType: string = "base";

    /**
     * The description of your service to be used in CLI prompt messages
     */
    protected mServiceDescription: string = "your API Mediation Layer";

    private readonly NO_CHANGES_MSG = "No changes to";
    private readonly CREATED_MSG = "Created";
    private readonly MODIFIED_MSG = "Modified";
    private readonly REMOVED_MSG = "Removed";
    private readonly WARNING_MSG = "Warning:";

    /**
     * This structure is populated during convertApimlProfileInfoToProfileConfig
     * and retrieved by the auto-init command handler to provide the data for the
     * output of the auto-init command.
     * @private
     */
    private mAutoInitReport: IAutoInitRpt = {
        configFileNm: "",
        changeForConfig: this.NO_CHANGES_MSG,
        startingConfig: null,
        endingConfig: null,
        profileRpts: []
    };

    /**
     * This is called by the {@link BaseAuthHandler#process} when it needs a
     * session. Should be used to create a session to connect to the auto-init
     * service.
     * @param {ICommandArguments} args The command line arguments to use for building the session
     * @returns {ISession} The session object built from the command line arguments.
     */
    protected createSessCfgFromArgs: (args: ICommandArguments) => ISession = ZosmfSession.createSessCfgFromArgs;

    /**
     * This is called by the "auto-init" command after it creates a session, to generate a configuration
     * @param {AbstractSession} session The session object to use to connect to the configuration service
     * @returns {Promise<string>} The response from the auth service containing a token
     * @throws {ImperativeError}
     */
    protected async doAutoInit(session: AbstractSession, params: IHandlerParameters): Promise<IConfig> {
        // Login with token authentication first, so we can support certificates
        if ((session.ISession.user && session.ISession.password) || (session.ISession.cert && session.ISession.certKey)) {
            // If it is basic authentication, we need to set the auth type.
            if (session.ISession.password) { session.ISession.type = SessConstants.AUTH_TYPE_TOKEN; }
            session.ISession.tokenType = SessConstants.TOKEN_TYPE_APIML;
            session.ISession.storeCookie = true;
            session.ISession.tokenValue = await Login.apimlLogin(session);
            session.ISession.storeCookie = false;
            session.ISession.type = SessConstants.AUTH_TYPE_TOKEN;

            session.ISession.base64EncodedAuth =
            session.ISession.user = session.ISession.password =
            session.ISession.cert = session.ISession.certKey = undefined;
        }

        const restErrUnauthorized = 403;
        const configs = Services.getPluginApimlConfigs();
        let profileInfos;
        try {
            profileInfos = await Services.getServicesByConfig(session, configs);
        } catch (err) {
            if (err instanceof RestClientError && err.mDetails && err.mDetails.httpStatus && err.mDetails.httpStatus === restErrUnauthorized) {
                throw new ImperativeError({
                    msg: "HTTP(S) error status 403 received. Verify the user has access to the APIML API Services SAF resource.",
                    additionalDetails: err.mDetails.additionalDetails,
                    causeErrors: err
                });
            } else {
                throw err;
            }
        }
        const profileConfig = Services.convertApimlProfileInfoToProfileConfig(profileInfos);

        // Populate the config with base profile information
        if (profileConfig.defaults.base == null && profileConfig.profiles.base == null) {
            profileConfig.profiles.base = {
                type: "base",
                properties: {
                    host: session.ISession.hostname,
                    port: session.ISession.port,
                    rejectUnauthorized: session.ISession.rejectUnauthorized
                },
                secure: []
            };
            profileConfig.defaults.base = "base";

            if (session.ISession.tokenType != null && session.ISession.tokenValue != null) {
                profileConfig.profiles.base.properties.tokenType = session.ISession.tokenType;
                profileConfig.profiles.base.properties.tokenValue = session.ISession.tokenValue;
                profileConfig.profiles.base.secure.push("tokenValue");
            }
        }

        this.recordProfilesFound(profileInfos);
        return profileConfig;
    }

    /**
     * This is called by our processAutoInit() base class function to display the set of actions
     * taken by the auto-init command.
     */
    protected displayAutoInitChanges(response: IHandlerResponseApi): void {
        // all profile updates have been made. Now we can record those updates.
        this.recordProfileUpdates();

        if (this.mAutoInitReport.changeForConfig === this.NO_CHANGES_MSG) {
            response.console.log("No changes were needed in the existing Zowe configuration file '" +
                path.basename(this.mAutoInitReport.configFileNm) + "'."
            );
            return;
        }

        // Report the type of config file changes
        response.console.log(this.colorizeKeyword(this.mAutoInitReport.changeForConfig) +
            " the Zowe configuration file '" +
            path.basename(this.mAutoInitReport.configFileNm) + "'."
        );

        // display information about each profile
        for (const nextProfRpt of this.mAutoInitReport.profileRpts) {
            let defOrAlt: string;
            const isDefaultProf =
                this.mAutoInitReport.endingConfig.properties.defaults[nextProfRpt.profType] ===
                nextProfRpt.profName;
            if (isDefaultProf)
            {
                defOrAlt = "default";
            } else {
                defOrAlt = "alternate";
            }

            let msg: string;
            msg = "\n" + this.colorizeKeyword(nextProfRpt.changeForProf) + " " + defOrAlt +
                " profile '" + nextProfRpt.profName + "' of type '" + nextProfRpt.profType + "'";
            if (nextProfRpt.profType !== "base") {
                msg += " with basePath '" + nextProfRpt.basePath + "'";
            }
            response.console.log(msg);

            // only report plugins and alternates for the default profile of each type
            if (!isDefaultProf) {
                continue;
            }

            // report plugins using this profile (except for base profiles)
            let loopCount: number;
            if (nextProfRpt.pluginNms.length > 0) {
                if (nextProfRpt.profType !== "base") {
                    loopCount = 1;
                    for (const pluginNm of nextProfRpt.pluginNms) {
                        if (loopCount == 1) {
                            msg = "    Packages that use profile type '" + nextProfRpt.profType + "': ";
                        } else {
                            msg += ", ";
                        }
                        msg += pluginNm;
                        loopCount++;
                    }
                    response.console.log(msg);
                }
            }

            // display the alternate profiles
            if (nextProfRpt.altProfiles.length > 0) {
                loopCount = 1;
                for (const altProf of nextProfRpt.altProfiles) {
                    if (loopCount == 1) {
                        msg = "    Alternate profiles of type '" + nextProfRpt.profType + "': ";
                    } else {
                        msg += ", ";
                    }
                    msg += altProf.altProfName;
                    loopCount++;
                }
                response.console.log(msg);
            }

            if (nextProfRpt.baseOverrides.length > 0) {
                const baseProfileName = this.mAutoInitReport.endingConfig.properties.defaults.base;
                msg = `    ${this.colorizeKeyword(this.WARNING_MSG)} This profile may require manual edits to work with APIML:`;
                for (const baseOverride of nextProfRpt.baseOverrides) {
                    msg += `\n        ${baseOverride.propName}: `;
                    if (!baseOverride.secure) {
                        msg += `'${baseOverride.priorityValue}' overrides '${baseOverride.baseValue}' in`;
                    } else {
                        msg += "secure value " + ((baseOverride.priorityValue != null) ? "overrides" : "may override");
                    }
                    msg += ` profile '${baseProfileName}'`;
                }
                response.console.log(msg);
            }
        }

        response.console.log(
            "\nYou can edit this configuration file to change your Zowe configuration:\n    " +
            this.mAutoInitReport.configFileNm
        );
    }

    /**
     * Colorize a change keyword for a message to be displayed.
     *
     * @param {string} changeKeyWd
     *        The keyword that we want to colorize.
     *
     * @returns {string} A string with the keyword in the appropriate color.
     */
    private colorizeKeyword(changeKeyword: string): string {
        let keywordInColor: string;
        switch(changeKeyword) {
            case this.CREATED_MSG:
            case this.MODIFIED_MSG:
                keywordInColor = TextUtils.chalk.greenBright(changeKeyword);
                break;
            case this.REMOVED_MSG:
                keywordInColor = TextUtils.chalk.redBright(changeKeyword);
                break;
            case this.WARNING_MSG:
                keywordInColor = TextUtils.chalk.yellowBright(changeKeyword);
                break;
            default:
                keywordInColor = changeKeyword;
                break;
        }
        return keywordInColor;
    }

    /**
     * Record the set of profiles found by our interrogation of plugins and APIML.
     * The information is re-arranged to enable easy reporting of the desired information.
     * This function assumes that the 'services' module continues to use its algorithm
     * in which the first profile of a given type is the profile that we select..
     * If that changes, this function must also change.
     *
     * @param {IApimlProfileInfo} apimlProfInfos
     *        The profileInfo array returned by services.getServicesByConfig().
     */
    private recordProfilesFound(apimlProfInfos: IApimlProfileInfo[]): void {
        // record our starting config
        if (ImperativeConfig.instance.config.exists) {
            this.mAutoInitReport.startingConfig = ImperativeConfig.instance.config.api.layers.get();

        } else {
            this.mAutoInitReport.startingConfig = null;
        }

        // Record the profiles found by APIML for each profile type
        for (const currProfInfo of apimlProfInfos) {
            const newProfRpt: IProfileRpt = {
                changeForProf: this.NO_CHANGES_MSG,
                profName: currProfInfo.profName,
                profType: currProfInfo.profType,
                basePath: currProfInfo.basePaths[0],
                pluginNms: [],
                altProfiles: [],
                baseOverrides: []
            };

            // add all of the plugins using this profile
            for (const nextPlugin of currProfInfo.pluginConfigs) {
                newProfRpt.pluginNms.push(nextPlugin.pluginName);
            }

            // each additional basePath for the current plugin is an alternate
            for (let basePathInx = 1; basePathInx < currProfInfo.basePaths.length; basePathInx++) {
                newProfRpt.altProfiles.push({
                    altProfName: currProfInfo.profName,
                    altProfType: currProfInfo.profType,
                    altBasePath: currProfInfo.basePaths[basePathInx]
                });
            }

            // each of the other profiles of the same profile type is an alternate
            for (const nextProfInfoOfType of apimlProfInfos) {
                if (nextProfInfoOfType.profName !== currProfInfo.profName &&
                    nextProfInfoOfType.profType === currProfInfo.profType)
                {
                    // each basePath constitutes another alternate
                    for (const nextBasePath of nextProfInfoOfType.basePaths) {
                        newProfRpt.altProfiles.push({
                            altProfName: nextProfInfoOfType.profName,
                            altProfType: nextProfInfoOfType.profType,
                            altBasePath: nextBasePath
                        });
                    }
                }
            }

            this.mAutoInitReport.profileRpts.push(newProfRpt);
        }
    }

    /**
     * Record how the profiles have been updated by auto-init.
     */
    private recordProfileUpdates(): void {
        // get our current (ending) config
        this.mAutoInitReport.endingConfig = ImperativeConfig.instance.config.api.layers.get();

        // record the config file name path
        this.mAutoInitReport.configFileNm = this.mAutoInitReport.endingConfig.path;

        this.mAutoInitReport.changeForConfig = this.NO_CHANGES_MSG;

        if (this.mAutoInitReport.startingConfig === null) {
            // We started with no config file, so everything was created.
            this.mAutoInitReport.changeForConfig = this.CREATED_MSG;
            for (const nextProfRpt of this.mAutoInitReport.profileRpts) {
                nextProfRpt.changeForProf = this.CREATED_MSG;
            }
        } else {
            /* We must compare starting config to ending config to determine
             * if we created or updated individual profiles.
             */
            const startCfgLayer = this.mAutoInitReport.startingConfig;
            const endCfgLayer = this.mAutoInitReport.endingConfig;

            if (!startCfgLayer.exists && endCfgLayer.exists) {
                // the starting config file existed, but was in a different layer
                if (this.mAutoInitReport.changeForConfig === this.NO_CHANGES_MSG) {
                    this.mAutoInitReport.changeForConfig = this.CREATED_MSG;

                    // each profile in this previously non-existent layer has been created
                    for (const nextProfRpt of this.mAutoInitReport.profileRpts) {
                        nextProfRpt.changeForProf = this.CREATED_MSG;
                    }
                }
            } else {
                /* We must compare profile-by-profile.
                 * Look for each profile from the ending config within the starting config
                 */
                for (const endProfNm of lodash.keys(endCfgLayer.properties.profiles)) {
                    if (lodash.has(startCfgLayer.properties.profiles, endProfNm)) {
                        if (lodash.isEqual(startCfgLayer.properties.profiles[endProfNm],
                            endCfgLayer.properties.profiles[endProfNm]))
                        {
                            // both starting profile and ending profile are the same
                            this.recordOneProfChange(endProfNm,
                                endCfgLayer.properties.profiles[endProfNm], this.NO_CHANGES_MSG
                            );
                        } else {
                            this.recordOneProfChange(endProfNm,
                                endCfgLayer.properties.profiles[endProfNm], this.MODIFIED_MSG
                            );
                        }
                    } else {
                        /* Each profile in the ending config that is not
                         * in the starting config has been created.
                         */
                        this.recordOneProfChange(endProfNm,
                            endCfgLayer.properties.profiles[endProfNm], this.CREATED_MSG
                        );
                    }
                }

                // Look for each profile from the staring config within the ending config
                for (const startProfNm of lodash.keys(startCfgLayer.properties.profiles)) {
                    /* We already recorded a message for profiles that exist in both
                     * the starting and ending configs in the loop above,
                     * so just record when the starting profile has been removed.
                     */
                    if (!lodash.has(endCfgLayer.properties.profiles, startProfNm)) {
                        this.recordOneProfChange(startProfNm,
                            endCfgLayer.properties.profiles[startProfNm], this.REMOVED_MSG
                        );
                    }
                }

                this.recordProfileConflictsWithBase();
            }
        }
    }

    /**
     * Record the change message for one profile with the
     * this.mAutoInitReport.profileRpts array.
     *
     * @param {string} profNmToRecord
     *        The name of the profile for which we want to record a change.
     *
     * @param {IConfigProfile} profObj
     *        An IConfigProfile object which is used when a new entry must be
     *        created in the profileRpts array.
     *
     * @param {string} msgToRecord
     *        The message to record for the type of change to this profile.
     */
    private recordOneProfChange(
        profNmToRecord: string,
        profObj: IConfigProfile,
        msgToRecord: string
    ) : void {
        // when any profile has been modified, we know the config was modified
        if (msgToRecord !== this.NO_CHANGES_MSG) {
            this.mAutoInitReport.changeForConfig = this.MODIFIED_MSG;
        }

        const profRptInx = lodash.findIndex(this.mAutoInitReport.profileRpts,
            {profName: profNmToRecord}
        );
        if (profRptInx >= 0) {
            // an entry for this profile already exists
            this.mAutoInitReport.profileRpts[profRptInx].changeForProf = msgToRecord;
        } else {
            // we must create a new IProfileRpt entry
            const newProfRpt: IProfileRpt = {
                changeForProf: msgToRecord,
                profName: profNmToRecord,
                profType: profObj.type,
                basePath: lodash.get(profObj, "properties.basePath", "Not supplied"),
                pluginNms: [],
                altProfiles: [],
                baseOverrides: []
            };
            this.mAutoInitReport.profileRpts.push(newProfRpt);
        }
    }

    /**
     * Record info about profile properties that override properties defined in
     * the base profile. These properties may prevent connecting to the APIML.
     */
    private recordProfileConflictsWithBase(): void {
        const configApi = ImperativeConfig.instance.config.api;
        const configJson = this.mAutoInitReport.endingConfig.properties;
        const baseProfileName = configJson.defaults?.base;
        if (baseProfileName == null) {
            return;  // default base profile is undefined
        }

        const baseProfile = lodash.get(configJson, configApi.profiles.expandPath(baseProfileName)) as IConfigProfile;
        if (baseProfile == null) {
            return;  // default base profile is invalid
        }

        for (const profileRpt of this.mAutoInitReport.profileRpts) {
            if (profileRpt.changeForProf === this.MODIFIED_MSG && profileRpt.profType !== "base") {
                const serviceProfile = lodash.get(configJson, configApi.profiles.expandPath(profileRpt.profName)) as IConfigProfile;
                for (const [name, value] of Object.entries(baseProfile.properties)) {
                    if (serviceProfile.properties[name] != null && serviceProfile.properties[name] !== baseProfile.properties[name]) {
                        profileRpt.baseOverrides.push({
                            propName: name,
                            secure: (baseProfile.secure || []).includes(name) || (serviceProfile.secure || []).includes(name),
                            priorityValue: serviceProfile.properties[name],
                            baseValue: value
                        });
                    }
                }
                for (const name of (baseProfile.secure || [])) {
                    if (serviceProfile.secure?.includes(name)) {
                        profileRpt.baseOverrides.push({ propName: name, secure: true });
                    }
                }
            }
        }
    }
}
