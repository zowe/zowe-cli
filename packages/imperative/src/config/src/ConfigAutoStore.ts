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

import * as lodash from "lodash";
import { ICommandArguments, IHandlerParameters } from "../../cmd";
import { ICommandHandlerRequire } from "../../cmd/src/doc/handler/ICommandHandlerRequire";
import { ICommandProfileAuthConfig } from "../../cmd/src/doc/profiles/definition/ICommandProfileAuthConfig";
import * as ConfigUtils from "./ConfigUtils";
import { AbstractAuthHandler } from "../../imperative/src/auth/handlers/AbstractAuthHandler";
import { ImperativeConfig } from "../../utilities";
import { ISession } from "../../rest/src/session/doc/ISession";
import { Session } from "../../rest/src/session/Session";
import { AUTH_TYPE_TOKEN, TOKEN_TYPE_APIML } from "../../rest/src/session/SessConstants";
import { Logger } from "../../logger";
import {
    IConfigAutoStoreFindActiveProfileOpts,
    IConfigAutoStoreFindAuthHandlerForProfileOpts,
    IConfigAutoStoreStoreSessCfgPropsOpts
} from "./doc/IConfigAutoStoreOpts";

/**
 * Class to manage automatic storage of properties in team config.
 */
export class ConfigAutoStore {
    /**
     * Finds the profile where auto-store properties should be saved.
     * @param params CLI handler parameters object
     * @param profileProps List of properties required in the profile schema
     * @returns Tuple containing profile type and name, or undefined if no profile was found
     */
    public static findActiveProfile(params: IHandlerParameters, profileProps: string[]): [string, string] | undefined {
        return this._findActiveProfile({ params, profileProps });
    }
    /**
     * Helper method to find an active profile based on the optional CLI handler parameters
     * @param opts Set of options required to find an active profile
     * @returns Tuple containing profile type and name, or undefined if no profile was found
     */
    private static _findActiveProfile(opts: IConfigAutoStoreFindActiveProfileOpts): [string, string] | undefined {
        const profileTypes = typeof opts.params !== "undefined" ? [
            ...(opts.params.definition.profile?.required || []),
            ...(opts.params.definition.profile?.optional || [])
        ] : opts.profileTypes || [];

        for (const profType of profileTypes) {
            const profileMatch = ImperativeConfig.instance.loadedConfig.profiles?.find(p => p.type === profType);
            if (profileMatch != null && opts.profileProps.every(propName => propName in profileMatch.schema.properties)) {
                return [profType, ConfigUtils.getActiveProfileName(profType, opts.params?.arguments, opts.defaultProfileName)];
            }
        }
    }

    /**
     * Finds the token auth handler class for a team config profile.
     * @param profilePath JSON path of profile
     * @param cmdArguments CLI arguments which may specify a profile
     * @returns Auth handler class or undefined if none was found
     */
    public static findAuthHandlerForProfile(profilePath: string, cmdArguments: ICommandArguments): AbstractAuthHandler | undefined {
        return this._findAuthHandlerForProfile({ profilePath, cmdArguments });
    }

    /**
     * Helper method that finds the token auth handler class for a team config profile
     * @param opts Set of options required to find the auth handler for a given profile path
     * @returns Auth handler class or undefined if none was found
     */
    private static _findAuthHandlerForProfile(opts: IConfigAutoStoreFindAuthHandlerForProfileOpts): AbstractAuthHandler | undefined {
        const config = opts.config || ImperativeConfig.instance.config;
        const profileType = lodash.get(config.properties, `${opts.profilePath}.type`);
        const profile = config.api.profiles.get(opts.profilePath.replace(/profiles\./g, ""), false);

        if (profile == null || profileType == null) { // Profile must exist and have type defined
            return;
        } else if (profileType === "base") {
            if (profile.tokenType == null) { // Base profile must have tokenType defined
                return;
            }
        } else {
            if (profile.basePath == null) { // Service profiles must have basePath defined
                return;
            }
            if (profile.tokenType == null) {  // If tokenType undefined in service profile, fall back to base profile
                const baseProfileName = ConfigUtils.getActiveProfileName("base", opts.cmdArguments, opts.defaultBaseProfileName);
                return this._findAuthHandlerForProfile({ ...opts, profilePath: config.api.profiles.getProfilePathFromName(baseProfileName) });
            }
        }

        const authConfigs: ICommandProfileAuthConfig[] = [];
        ImperativeConfig.instance.loadedConfig.profiles?.forEach((profCfg) => {
            if ((profCfg.type === profileType || profCfg.type === "base") && profCfg.authConfig != null) {
                authConfigs.push(...profCfg.authConfig);
            }
        });

        for (const authConfig of authConfigs) {
            const authHandler: ICommandHandlerRequire = require(authConfig.handler);
            const authHandlerClass = new authHandler.default();

            if (authHandlerClass instanceof AbstractAuthHandler) {
                const { promptParams } = authHandlerClass.getAuthHandlerApi();
                if (profile.tokenType === promptParams.defaultTokenType || profile.tokenType.startsWith(TOKEN_TYPE_APIML)) {
                    return authHandlerClass;  // Auth service must have matching token type
                }
            }
        }
    }

    /**
     * Stores session config properties into a team config profile.
     * @param params CLI handler parameters object
     * @param sessCfg Session config containing properties to store
     * @param propsToStore Names of properties that should be stored
     */
    public static async storeSessCfgProps(params: IHandlerParameters, sessCfg: { [key: string]: any }, propsToStore: string[]): Promise<void> {
        return this._storeSessCfgProps({ params, sessCfg, propsToStore });
    }

    /**
     * Stores session config properties into a team config profile.
     * @param opts Set of options required to store session config properties
     */
    public static async _storeSessCfgProps(opts: IConfigAutoStoreStoreSessCfgPropsOpts): Promise<void> {
        const config = opts.config || ImperativeConfig.instance.config;
        // TODO Which autoStore value should take priority if it conflicts between layers
        if (opts.propsToStore.length == 0 || !config?.exists || !config.properties.autoStore) {
            return;
        }

        let profileProps = opts.propsToStore.map(propName => propName === "hostname" ? "host" : propName);
        const profileData = this._findActiveProfile({ ...opts, profileProps });
        if (profileData == null && opts.profileName == null && opts.profileType == null) {
            return;
        }
        const [profileType, profileName] = profileData ?? [opts.profileType, opts.profileName];
        const profilePath = config.api.profiles.getProfilePathFromName(profileName);

        // Replace user and password with tokenValue if tokenType is defined in config
        if (profileProps.includes("user") && profileProps.includes("password") && await this._fetchTokenForSessCfg({ ...opts, profilePath })) {
            profileProps = profileProps.filter(propName => propName !== "user" && propName !== "password");
            profileProps.push("tokenValue");
        }

        const beforeLayer = config.api.layers.get();
        const foundLayer = config.api.layers.find(profileName);
        if (foundLayer != null) {
            const { user, global } = foundLayer;
            config.api.layers.activate(user, global);
        }

        const profileObj = config.api.profiles.get(profileName, false);
        const profileSchema = ImperativeConfig.instance.loadedConfig.profiles?.find(p => p.type === profileType)?.schema;
        const profileSecureProps = config.api.secure.securePropsForProfile(profileName);

        const baseProfileName = ConfigUtils.getActiveProfileName("base", opts.params?.arguments, opts.defaultBaseProfileName);
        const baseProfileObj = config.api.profiles.get(baseProfileName, false);
        const baseProfileSchema = ImperativeConfig.instance.loadedConfig.baseProfile.schema;
        const baseProfileSecureProps = config.api.secure.securePropsForProfile(baseProfileName);

        for (const propName of profileProps) {
            let propProfilePath = profilePath;
            let isSecureProp = profileSchema?.properties[propName]?.secure || profileSecureProps.includes(propName);
            /* If any of the following is true, then property should be stored in base profile:
                (1) Service profile does not exist, but base profile does
                (2) Property is missing from service profile properties/secure objects, but present in base profile
                (3) Property is tokenValue and tokenType is missing from service profile, but present in base profile
                (4) Given profile is just a base profile :yum:
            */
            if ((!config.api.profiles.exists(profileName) && config.api.profiles.exists(baseProfileName)) ||
                (profileObj[propName] == null && !profileSecureProps.includes(propName) &&
                    (baseProfileObj[propName] != null || baseProfileSecureProps.includes(propName))) ||
                (propName === "tokenValue" && profileObj.tokenType == null && baseProfileObj.tokenType != null ||
                profileType === "base")
            ) {
                propProfilePath = config.api.profiles.getProfilePathFromName(baseProfileName);
                isSecureProp = baseProfileSchema.properties[propName].secure || baseProfileSecureProps.includes(propName);
            }

            // If secure array at higher level includes this property, then property should be stored at higher level
            if (isSecureProp) {
                const secureProfile = config.api.secure.secureInfoForProp(`${propProfilePath}.properties.${propName}`, true);
                let secureProfilePath: string;
                if (secureProfile != null) secureProfilePath = secureProfile.path;
                if (secureProfilePath != null && secureProfilePath.split(".").length < propProfilePath.split(".").length) {
                    propProfilePath = secureProfilePath.slice(0, secureProfilePath.lastIndexOf("."));
                }
            }

            const sessCfgPropName = propName === "host" ? "hostname" : propName;
            config.set(`${propProfilePath}.properties.${propName}`, opts.sessCfg[sessCfgPropName], {
                secure: opts.setSecure ?? isSecureProp
            });
        }

        await config.save();
        const storedMsg = `Stored properties in ${config.layerActive().path}: ${profileProps.join(", ")}`;
        if (opts.params) {
            opts.params.response.console.log(storedMsg);
        } else {
            Logger.getAppLogger().info(storedMsg);
        }
        // Restore original active layer
        config.api.layers.activate(beforeLayer.user, beforeLayer.global);
    }

    /**
     * Retrieves token value that will be auto-stored into session config.
     * @param params CLI handler parameters object
     * @param sessCfg Session config with credentials for basic or cert auth
     * @param profilePath JSON path of profile containing tokenType
     * @returns True if auth handler was found and token was fetched
     */
    private static async fetchTokenForSessCfg(params: IHandlerParameters, sessCfg: { [key: string]: any }, profilePath: string): Promise<boolean> {
        return this._fetchTokenForSessCfg({ params, sessCfg, profilePath });
    }

    /**
     * Helper function that retrieves token value that will be auto-stored into session config
     * @param opts Set of options required to fetch the token value to be auto-stored
     * @returns True if auth handler was found and token was fetched
     */
    private static async _fetchTokenForSessCfg(opts: IConfigAutoStoreStoreSessCfgPropsOpts): Promise<boolean> {
        const authHandlerClass = this._findAuthHandlerForProfile(opts);

        if (authHandlerClass == null) {
            return false;
        }

        const api = authHandlerClass.getAuthHandlerApi();
        opts.sessCfg.type = AUTH_TYPE_TOKEN;
        opts.sessCfg.tokenType = opts.params?.arguments?.tokenType ?? api.promptParams.defaultTokenType;
        const baseSessCfg: ISession = { type: opts.sessCfg.type };

        for (const propName of Object.keys(ImperativeConfig.instance.loadedConfig.baseProfile.schema.properties)) {
            const sessCfgPropName = propName === "host" ? "hostname" : propName;
            if (opts.sessCfg[sessCfgPropName] != null) {
                (baseSessCfg as any)[sessCfgPropName] = opts.sessCfg[sessCfgPropName];
            }
        }

        Logger.getAppLogger().info(`Fetching ${opts.sessCfg.tokenType} for ${opts.profilePath}`);
        opts.sessCfg.tokenValue = await api.sessionLogin(new Session(baseSessCfg));
        opts.sessCfg.user = opts.sessCfg.password = undefined;
        return true;
    }
}
