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

import { AbstractSession, IConfig, IConfigProfile, ImperativeConfig, ImperativeExpect, Logger,
         PluginManagementFacility, RestClient } from "@zowe/imperative";
import { ApimlConstants } from "./ApimlConstants";
import { IApimlProfileInfo } from "./doc/IApimlProfileInfo";
import { IApimlService } from "./doc/IApimlService";
import { IApimlSvcAttrsLoaded } from "./doc/IApimlSvcAttrsLoaded";
import * as JSONC from "comment-json";
import { ConfigConstants } from "../../../../../imperative/lib";

/**
 * Class to handle listing services on APIML gateway.
 * @export
 * @class Services
 */
export class Services {
    /**
     * Forms a list of APIML service attributes needed to query APIML for every
     * REST service for every loaded command group. This information can later
     * be used to create every connection profile required for every loaded
     * command group.
     *
     * @returns The APIML service attributes needed to query APIML.
     */
    public static getPluginApimlConfigs(): IApimlSvcAttrsLoaded[] {
        const apimlConfigs: IApimlSvcAttrsLoaded[] = [];
        ImperativeExpect.toNotBeNullOrUndefined(ImperativeConfig.instance.loadedConfig,
            "Imperative.init() must be called before getPluginApimlConfigs()"
        );

        // Get the APIML configs from the loaded imperative config
        for (const apimlConfig of (ImperativeConfig.instance.loadedConfig.apimlConnLookup || [])) {
            apimlConfigs.push({
                ...apimlConfig,
                connProfType: apimlConfig.connProfType || ImperativeConfig.instance.loadedConfig.profiles[0].type,
                pluginName: ImperativeConfig.instance.hostPackageName
            });
        }

        // Load APIML configs from all plugins
        for (const pluginCfgProps of PluginManagementFacility.instance.allPluginCfgProps) {
            for (const apimlConfig of (pluginCfgProps.impConfig.apimlConnLookup || [])) {
                apimlConfigs.push({
                    ...apimlConfig,
                    connProfType: apimlConfig.connProfType || pluginCfgProps.impConfig.profiles[0].type,
                    pluginName: pluginCfgProps.pluginName
                });
            }
        }
        return apimlConfigs;
    }

    /**
     * Calls the services endpoint of the APIML gateway to obtain a list of
     * services that support Single Sign-On. This list is compared against a
     * list of APIML service attributes defined in CLI plug-in configs. When a
     * service's API ID is present in both lists, a profile info object is
     * generated to store CLI profile info for connecting to that service.
     * @static
     * @param session Session with APIML connection info
     * @param configs APIML service attributes defined by CLI plug-ins
     * @returns List of objects containing profile info for APIML services
     * @memberof Services
     */
    public static async getServicesByConfig(session: AbstractSession, configs: IApimlSvcAttrsLoaded[]): Promise<IApimlProfileInfo[]> {
        Logger.getAppLogger().trace("Services.getByConfig()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        if (session.ISession.type === "basic") {
            ImperativeExpect.toNotBeNullOrUndefined(session.ISession?.user, "User name for API ML basic login must be defined.");
            ImperativeExpect.toNotBeNullOrUndefined(session.ISession?.password, "Password for API ML basic login must be defined.");
        } else {
            ImperativeExpect.toBeEqual(session.ISession?.tokenType, "apimlAuthenticationToken", "Token type for API ML token login must be apimlAuthenticationToken.");
            ImperativeExpect.toNotBeNullOrUndefined(session.ISession?.tokenValue, "Token value for API ML token login must be defined.");
        }

        // Perform GET request on APIML services endpoint
        const services = await RestClient.getExpectJSON<IApimlService[]>(session, ApimlConstants.SERVICES_ENDPOINT);
        const ssoServices = services.filter(({ apiml }) => apiml.authentication?.[0]?.supportsSso);

        const profInfos: IApimlProfileInfo[] = [];
        // Loop through every APIML service that supports SSO
        for (const service of ssoServices) {
            // Loop through every API advertised by this service
            for (const apiInfo of service.apiml.apiInfo) {
                // Loop through any IApimlSvcAttrs object with a matching API ID
                for (const config of configs.filter(({ apiId }) => apiId === apiInfo.apiId)) {
                    if (config.gatewayUrl == null || apiInfo.gatewayUrl === config.gatewayUrl) {
                        // Update or create IApimlProfileInfo object for this service ID and profile type
                        let profInfo = profInfos.find(({ profName, profType }) => profName === service.serviceId && profType === config.connProfType);
                        if (profInfo == null) {
                            profInfo = {
                                profName: service.serviceId,
                                profType: config.connProfType,
                                basePaths: [],
                                pluginConfigs: new Set(),
                                conflictTypes: []
                            };
                            profInfos.push(profInfo);
                        }

                        if (!profInfo.basePaths.includes(apiInfo.basePath)) {
                            if (apiInfo.gatewayUrl === config.gatewayUrl || apiInfo.defaultApi) {
                                const numGatewayUrls = new Array(...profInfo.pluginConfigs).reduce((urls, cfg) => {
                                    if (cfg.gatewayUrl != null && !urls.includes(cfg.gatewayUrl)) {
                                        urls.push(cfg.gatewayUrl);
                                    }
                                    return urls;
                                }, []).length;
                                profInfo.basePaths.splice(numGatewayUrls, 0, apiInfo.basePath);
                            } else {
                                profInfo.basePaths.push(apiInfo.basePath);
                            }
                        }

                        profInfo.pluginConfigs.add(config);
                    }
                }
            }
        }

        // Find conflicts in profile info array
        for (const profInfo of profInfos) {
            // If multiple CLI plug-ins require different gateway URLs for the
            // same API ID and CLI profile type, we have a conflict because the
            // plugins expect different base paths and may be incompatible.

            // First we group gateway URLs by their associated CLI plug-in
            const gatewayUrlsByPlugin: { [key: string]: Set<string> } = {};
            for (const { gatewayUrl, pluginName } of new Array(...profInfo.pluginConfigs).filter(cfg => cfg.gatewayUrl)) {
                gatewayUrlsByPlugin[pluginName] = new Set([
                    ...(gatewayUrlsByPlugin[pluginName] || []),
                    gatewayUrl
                ]);
            }

            if (Object.keys(gatewayUrlsByPlugin).length > 0) {
                // Now we look for a gateway URL in common across all the plug-ins
                const preferredGatewayUrl = new Array(...gatewayUrlsByPlugin[Object.keys(gatewayUrlsByPlugin)[0]])
                    .find(gatewayUrl => {
                        return new Array(...Object.values(gatewayUrlsByPlugin).slice(1))
                            .every(gatewayUrls => new Array(...gatewayUrls).includes(gatewayUrl));
                    });

                if (preferredGatewayUrl == null) {
                    // If no common gateway URL could be found, we have a conflict
                    profInfo.conflictTypes.push("basePaths");
                } else {
                    // If common gateway URL was found, move its associated base path to the front of the list
                    const preferredBasePath = profInfo.basePaths.find(basePath => basePath.endsWith(preferredGatewayUrl));
                    if (preferredBasePath != null) {
                        profInfo.basePaths = profInfo.basePaths.filter(basePath => basePath !== preferredBasePath);
                        profInfo.basePaths.unshift(preferredBasePath);
                    }
                }
            }

            // If multiple profile infos have the same type, we have a conflict
            // because we don't know which profile should be the default.
            if (profInfos.filter(({ profType }) => profType === profInfo.profType).length > 1) {
                profInfo.conflictTypes.push("profType");
            }
        }

        return profInfos;
    }

    /**
     * Converts apiml profile information to team config profile objects to be stored in a zowe.config.json file
     * @param profileInfoList List of apiml profiles
     * @returns List of config profile objects
     * @example
     *  IConfigProfile = {
     *      properties: {},
     *      profiles: {
     *          "ibmzosmf": {
     *              type: "zosmf",
     *              properties: {
     *                  "basePath": "/ibmzosmf/api/v1"
     *              }
     *          },
     *          "service2": {
     *              type: "profile-type-for-service-defined-by-plugin",
     *              properties: {
     *                  // Multiple base paths were detected for this service.
     *                  // Uncomment one of the lines below to use a different one.
     *                  //"basePath": "/service2/ws/v1"
     *                  "basePath": "/service2/ws/v2"
     *              }
     *          }
     *      }
     *  }
     * @memberof Services
     */
    public static convertApimlProfileInfoToProfileConfig(profileInfoList: IApimlProfileInfo[]): IConfig {
        const configProfile: IConfigProfile = {
            properties: {},
            profiles: {}
        };

        let configDefaults: {[key: string]: string} = {};
        const conflictingDefaults: {[key: string]: string[]} = {};
        const configPlugins: Set<string> = new Set<string>();

        const _genCommentsHelper = (key: string, elements: string[]): string => {
            if (elements == null) return "";
            return `//"${key}": "${elements.length === 1 ? elements[0] : elements.join('"\n//"' + key + '": "')}"`;
        }

        profileInfoList.forEach((profileInfo: IApimlProfileInfo) => {

            profileInfo.pluginConfigs.forEach((pluginInfo: IApimlSvcAttrsLoaded) => {
                configPlugins.add(pluginInfo.pluginName);
            });

            if (!configDefaults[profileInfo.profType]) {
                configDefaults[profileInfo.profType] = profileInfo.profName;
            } else {
                if (!conflictingDefaults[profileInfo.profType]) {
                    conflictingDefaults[profileInfo.profType] = [];
                }
                conflictingDefaults[profileInfo.profType].push(profileInfo.profName);
            }

            configProfile.profiles[profileInfo.profName] = {
                type: profileInfo.profType,
                properties: {}
            };

            const basePaths: string[] = JSON.parse(JSON.stringify(profileInfo.basePaths));
            if (basePaths.length === 1) {
                configProfile.profiles[profileInfo.profName].properties.basePath = basePaths[0];
            } else if (basePaths.length > 1) {
                const defaultBasePath = basePaths.shift();
                configProfile.profiles[profileInfo.profName].properties = JSONC.parse(`
                    {
                        // Multiple base paths were detected for this service.
                        // Uncomment one of the lines below to use a different one.
                        ${_genCommentsHelper("basePath", basePaths)}
                        "basePath": "${defaultBasePath}"
                    }`
                );
            }
        });

        for (const defaultKey in conflictingDefaults) {
            if (configDefaults[defaultKey] != null) {
                const trueDefault = configDefaults[defaultKey];
                delete configDefaults[defaultKey];

                configDefaults = JSONC.parse(`${JSONC.stringify(configDefaults, null, ConfigConstants.INDENT).slice(0, -1)},
                    // Multiple services were detected.
                    // Uncomment one of the lines below to set a different default
                    ${_genCommentsHelper(defaultKey, conflictingDefaults[defaultKey])}
                    "${defaultKey}": "${trueDefault}"
                }`);
            }
        }

        const configResult: IConfig = {
            profiles: configProfile.profiles,
            defaults: configDefaults,
            plugins: [...configPlugins]
        };
        return configResult;
    }
}
