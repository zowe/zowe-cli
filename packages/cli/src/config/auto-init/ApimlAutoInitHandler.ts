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

import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { BaseAutoInitHandler, AbstractSession, ICommandArguments, ISession, Config,
         ImperativeConfig, IHandlerParameters, ConfigConstants, TextUtils, SessConstants } from "@zowe/imperative";
import { Login, Services } from "@zowe/core-for-zowe-sdk";
import { diff } from "jest-diff";
import * as open from "open";
import * as JSONC from "comment-json";
import * as lodash from "lodash";
import stripAnsi = require("strip-ansi");

/**
 * This class is used by the auth command handlers as the base class for their implementation.
 */
export default class ApimlAutoInitHandler extends BaseAutoInitHandler {
    /**
     * The profile type where token type and value should be stored
     */
    protected mProfileType: string = "base";

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
     */
    protected async doAutoInit(session: AbstractSession, params: IHandlerParameters) {
        const configs = Services.getPluginApimlConfigs();
        const profileInfos = await Services.getServicesByConfig(session, configs);
        const profileConfig = Services.convertApimlProfileInfoToProfileConfig(profileInfos);
        let global = false;
        let user = false;

        // Populate the config with base profile information
        if (profileConfig.defaults.base == null && profileConfig.profiles.my_base == null) {
            profileConfig.profiles.my_base = {
                type: "base",
                properties: {
                    host: session.ISession.hostname,
                    port: session.ISession.port
                },
                secure: []
            }
            profileConfig.defaults.base = "my_base"

            if (session.ISession.tokenType != null && session.ISession.tokenValue != null) {
                profileConfig.profiles.my_base.properties.authToken = `${session.ISession.tokenType}=${session.ISession.tokenValue}`
                profileConfig.profiles.my_base.secure.push("authToken");
            } else if (session.ISession.user && session.ISession.password) {
                const tokenType = SessConstants.TOKEN_TYPE_APIML;
                session.ISession.tokenType = tokenType;
                session.ISession.type = SessConstants.AUTH_TYPE_TOKEN;
                const tokenValue = await Login.apimlLogin(session);
                profileConfig.profiles.my_base.properties.authToken = `${tokenType}=${tokenValue}`;
                profileConfig.profiles.my_base.secure.push("authToken");
            }
        }

        // Use params to set which config layer to apply to
        if (params.arguments.globalConfig && params.arguments.globalConfig === true) {
            global = true;
        }
        if (params.arguments.userConfig && params.arguments.userConfig === true) {
            user = true
        }
        ImperativeConfig.instance.config.api.layers.activate(user, global);

        if (params.arguments.dryRun && params.arguments.dryRun === true) {
            // Merge and display, do not save
            // TODO preserve comments

            // Handle if the file doesn't actually exist
            let original: any = ImperativeConfig.instance.config.api.layers.get();
            let originalProperties: any;
            if (original.exists === false) {
                originalProperties = {};
            } else {
                originalProperties = JSONC.parse(JSONC.stringify(original.properties));

                // Hide secure stuff
                for (const secureProp of ImperativeConfig.instance.config.api.secure.secureFields(original)) {
                    if (lodash.has(originalProperties, secureProp)) {
                        lodash.unset(originalProperties, secureProp);
                    }
                }
            }

            let dryRun: any = ImperativeConfig.instance.config.api.layers.dryRunMerge(profileConfig);
            const dryRunProperties = JSONC.parse(JSONC.stringify(dryRun.properties));

            // Hide secure stuff
            for (const secureProp of ImperativeConfig.instance.config.api.secure.findSecure(dryRun.properties.profiles, "profiles")) {
                if (lodash.has(dryRunProperties, secureProp)) {
                    lodash.unset(dryRunProperties, secureProp);
                }
            }

            original = JSONC.stringify(originalProperties,
                                      null,
                                      ConfigConstants.INDENT);
            dryRun = JSONC.stringify(dryRunProperties,
                                     null,
                                     ConfigConstants.INDENT);

            let jsonDiff = diff(original, dryRun, {aAnnotation: "Removed",
                                                   bAnnotation: "Added",
                                                   aColor: TextUtils.chalk.red,
                                                   bColor: TextUtils.chalk.green});

            if (stripAnsi(jsonDiff) === "Compared values have no visual difference.") {
                jsonDiff = dryRun;
            }

            params.response.console.log(jsonDiff);
            params.response.data.setObj(jsonDiff);
        } else if (params.arguments.edit && params.arguments.edit === true) {
            // Open in the default editor
            // TODO make this work in an environment without a GUI
            await open(ImperativeConfig.instance.config.api.layers.get().path, {wait: true});
        } else if (params.arguments.overwrite && params.arguments.overwrite === true) {
            if (params.arguments.forSure && params.arguments.forSure === true) {
                // Clear layer, merge, and save
                ImperativeConfig.instance.config.api.layers.set(profileConfig);
                await ImperativeConfig.instance.config.api.layers.write({user, global});
            }
        } else {
            // Merge and save
            ImperativeConfig.instance.config.api.layers.merge(profileConfig);
            await ImperativeConfig.instance.config.save(false);
        }
    }
}
