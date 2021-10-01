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
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { BaseAutoInitHandler, AbstractSession, Config, ICommandArguments, ISession, IHandlerResponseApi,
    IHandlerParameters, SessConstants, IConfig, ImperativeConfig, ImperativeError, RestClientError
} from "@zowe/imperative";
import { IApimlProfileInfo, IApimlSvcAttrsLoaded, Login, Services } from "@zowe/core-for-zowe-sdk";
import { IAutoInitRpt } from "@zowe/core-for-zowe-sdk/lib/apiml/doc/IAutoInitRpt";
import { IProfileRpt } from "@zowe/core-for-zowe-sdk/lib/apiml/doc/IProfileRpt";
import { IAltProfile } from "@zowe/core-for-zowe-sdk/lib/apiml/doc/IAltProfile";

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
    private readonly UPDATED_MSG = "Updated";

    /**
     * This structure is populated during convertApimlProfileInfoToProfileConfig
     * and retrieved by the auto-init command handler to provide the data for the
     * output of the auto-init command.
     * @private
     */
    private mAutoInitReport: IAutoInitRpt = {
        configFileNm: "",
        typeOfChange: this.NO_CHANGES_MSG,
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
                    port: session.ISession.port
                },
                secure: []
            };
            profileConfig.defaults.base = "base";

            if (session.ISession.tokenType != null && session.ISession.tokenValue != null) {
                profileConfig.profiles.base.properties.tokenType = session.ISession.tokenType;
                profileConfig.profiles.base.properties.tokenValue = session.ISession.tokenValue;
                profileConfig.profiles.base.secure.push("tokenValue");
            } else if (session.ISession.user && session.ISession.password) {
                const tokenType = SessConstants.TOKEN_TYPE_APIML;
                session.ISession.tokenType = tokenType;
                session.ISession.type = SessConstants.AUTH_TYPE_TOKEN;
                const tokenValue = await Login.apimlLogin(session);
                profileConfig.profiles.base.properties.tokenType = tokenType;
                profileConfig.profiles.base.properties.tokenValue = tokenValue;
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

        // information about the config file
        response.console.log(this.mAutoInitReport.typeOfChange +
            " the following Zowe configuration file: " + path.basename(this.mAutoInitReport.configFileNm)
        );

        // information about each selected profile
        let editMsg = "change your Zowe configuration"
        for (let profRpt of this.mAutoInitReport.profileRpts) {
            response.console.log("\n" + profRpt.typeOfChange +
                " profile '" + profRpt.selProfNm + "' of type '" + profRpt.selProfType +
                "' with basePath '" + profRpt.selBasePath + "'"
            );

            let msg = "    Plugins that use this profile: ";
            let loopCount = 1;
            for (let pluginNm of profRpt.pluginNms) {
                if (loopCount > 1) {
                    msg += ", ";
                }
                msg += pluginNm;
                loopCount++;
            }
            response.console.log(msg);

            // display the alternate profiles
            if (profRpt.altProfiles.length > 0) {
                response.console.log("    Alternate profiles of type '" + profRpt.selProfType + "' are:");
                for (let altProf of profRpt.altProfiles) {
                    response.console.log("        Profile '" + altProf.altProfName +
                        "' with basePath '" + altProf.altBasePath + "'"
                    );
                }
                editMsg = "select an alternate profile"
            }
        }
        response.console.log("\nYou can edit this configuration file to " + editMsg + ":\n    " +
            this.mAutoInitReport.configFileNm);

        // todo: display the rest of the report
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
        // record the starting config
        if (ImperativeConfig.instance.config.exists) {
            this.mAutoInitReport.startingConfig = ImperativeConfig.instance.config;

        } else {
            this.mAutoInitReport.startingConfig = null;
            this.mAutoInitReport.typeOfChange = this.CREATED_MSG;
        }

        // Record the first profile found by APIML for each profile type as a selected profile
        let alreadySelProfTypes: string[] = [];
        apimlProfsLoop:
        for (let currProfInx = 0; currProfInx < apimlProfInfos.length; currProfInx++) {
            // has this profile type already been recorded as selected?
            for (let alreadySelType of alreadySelProfTypes) {
                if (apimlProfInfos[currProfInx].profType === alreadySelType) {
                    continue apimlProfsLoop;
                }
            }

            // this is our first encounter with a profile of this type, so we select it
            let newProfRpt: IProfileRpt = {
                typeOfChange: this.NO_CHANGES_MSG,
                selProfNm: apimlProfInfos[currProfInx].profName,
                selProfType: apimlProfInfos[currProfInx].profType,
                selBasePath: apimlProfInfos[currProfInx].basePaths[0],
                pluginNms: [],
                altProfiles: []
            };

            // add all of the plugins using this profile
            for (let pluginObj of apimlProfInfos[currProfInx].pluginConfigs) {
                newProfRpt.pluginNms.push(pluginObj.pluginName);
            }

            // check for the same profile type among our remaining profiles - they are alternates
            for (let remainProfInx = currProfInx + 1; remainProfInx < apimlProfInfos.length; remainProfInx++) {
                if (apimlProfInfos[currProfInx].profType === apimlProfInfos[remainProfInx].profType) {
                    for (let apimlPluginCfg of apimlProfInfos[remainProfInx].pluginConfigs) {
                        let newAltProf: IAltProfile = {
                            altProfName: apimlProfInfos[remainProfInx].profName,
                            altProfType: apimlPluginCfg.connProfType,
                            altBasePath: "" // placeholder until we determine the right value
                        }

                        // each basePath found by apiml for this profile is another alternate
                        for (let nextBasePath of apimlProfInfos[remainProfInx].basePaths) {
                            newAltProf.altBasePath = nextBasePath;
                            newProfRpt.altProfiles.push(newAltProf);
                        }
                    }
                }
            }

            alreadySelProfTypes.push(newProfRpt.selProfType);
            this.mAutoInitReport.profileRpts.push(newProfRpt);
        }
    }

    /**
     * Record how the profiles have been updated by auto-init.
     */
    private recordProfileUpdates(): void {
        // get our current (ending) config
        this.mAutoInitReport.endingConfig = ImperativeConfig.instance.config;

        // record the config file name path
        this.mAutoInitReport.configFileNm = ImperativeConfig.instance.config.api.layers.get().path;

        // todo: compare starting config with the ending config and set values for 'typeOfChange' fields
        if (this.mAutoInitReport.startingConfig === null) {
            // We started with ino config file, so every profile was created.
            for (let profRpt of this.mAutoInitReport.profileRpts) {
                profRpt.typeOfChange = this.CREATED_MSG;
            }
        } else {
            // must check starting config to ending config to determine if we created or updated a profile
            let startCfgLayer = this.mAutoInitReport.startingConfig.api.layers.get();
            let endCfgLayer = this.mAutoInitReport.endingConfig.api.layers.get();
            for (let profRpt of this.mAutoInitReport.profileRpts) {
                // zzz profRpt.selProfNm
            }
        }

        /* todo: Detect previous direct-to-service profile that has a port and has the same
         * profile name as retrieved from APIML (like "zosmf"). Now the profile named "zosmf"
         * will have a basePath for APIML, but the old port number form before..
         * The old port will break connections that will now attempt to connect to APIML.
         * This detection might reside in displayAutoInitChanges?
         */
    }
}
