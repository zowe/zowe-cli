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

import { AbstractSession, ConfigConstants, IConfig, IConfigProfile, ImperativeConfig, ImperativeExpect, Logger,
    PluginManagementFacility, RestClient } from "@zowe/imperative";
import { ApimlConstants } from "./ApimlConstants";
import { IApimlProfileInfo } from "./doc/IApimlProfileInfo";
import { IApimlService } from "./doc/IApimlService";
import { IApimlSvcAttrsLoaded } from "./doc/IApimlSvcAttrsLoaded";
import * as JSONC from "comment-json";

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
     * @throws {ImperativeError} When Imperative.init() has not been called
     *                           before getPluginApimlConfigs().
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
     * @throws {ImperativeError} When session object is undefined or missing
     *                           authentication info, or the REST request fails
     * @returns List of objects containing profile info for APIML services
     * @memberof Services
     */
    public static async getServicesByConfig(session: AbstractSession, configs: IApimlSvcAttrsLoaded[]): Promise<IApimlProfileInfo[]> {
        Logger.getAppLogger().trace("Services.getByConfig()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        if (session.ISession.type === "basic") {
            ImperativeExpect.toNotBeNullOrUndefined(session.ISession.user, "User name for API ML basic login must be defined.");
            ImperativeExpect.toNotBeNullOrUndefined(session.ISession.password, "Password for API ML basic login must be defined.");
        } else {
            ImperativeExpect.toBeEqual(session.ISession.tokenType, "apimlAuthenticationToken",
                "Token type for API ML token login must be apimlAuthenticationToken.");
            ImperativeExpect.toNotBeNullOrUndefined(session.ISession.tokenValue, "Token value for API ML token login must be defined.");
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
                                gatewayUrlConflicts: {}
                            };
                            profInfos.push(profInfo);
                        }

                        if (!profInfo.basePaths.includes(apiInfo.basePath)) {
                            if (apiInfo.gatewayUrl === config.gatewayUrl || apiInfo.defaultApi) {
                                const numGatewayUrls = new Set(new Array(...profInfo.pluginConfigs)
                                    .filter(({ gatewayUrl }) => gatewayUrl)
                                    .map(({ gatewayUrl }) => gatewayUrl)).size;
                                profInfo.basePaths.splice(numGatewayUrls, 0, apiInfo.basePath);
                            } else {
                                profInfo.basePaths.push(apiInfo.basePath);
                            }
                        }

                        profInfo.pluginConfigs.add(config);
                        profInfo.gatewayUrlConflicts[config.pluginName] = [
                            ...(profInfo.gatewayUrlConflicts[config.pluginName] || []),
                            apiInfo.gatewayUrl
                        ];
                    }
                }
            }
        }

        // Filter base paths and detect conflicts in profile info array
        for (const profInfo of profInfos) {
            // Find the set of gateway URLs common to all CLI plug-ins
            const commonGatewayUrls = Object.values(profInfo.gatewayUrlConflicts)
                .reduce((a, b) => a.filter(x => b.includes(x)));

            if (commonGatewayUrls.length > 0) {
                const serviceIdPrefix = new RegExp(`^/${profInfo.profName}/`);
                profInfo.basePaths = profInfo.basePaths.filter(basePath =>
                    commonGatewayUrls.includes(basePath.replace(serviceIdPrefix, "")));
                profInfo.gatewayUrlConflicts = {};
            }
        }

        return profInfos;
    }

    /**
     * Converts apiml profile information to team config profile objects to be stored in a zowe.config.json file
     * @param profileInfoList List of apiml profiles
     * @returns List of config profile objects
     * @example
     *  Input: IApimlProfileInfo[] = [
     *      {
     *          profName: 'zosmf',
     *          profType: 'zosmf',
     *          basePaths: [ '/zosmf/api/v1' ],
     *          pluginConfigs: Set(1) { [IApimlSvcAttrsLoaded] },
     *          conflictTypes: [ 'profType' ]
     *      },
     *      {
     *          profName: 'ibmzosmf',
     *          profType: 'zosmf',
     *          basePaths: [ '/ibmzosmf/api/v1' ],
     *          pluginConfigs: Set(1) { [IApimlSvcAttrsLoaded] },
     *          conflictTypes: [ 'profType' ]
     *      }
     *  ]
     *  Output: IConfig = {
     *      "profiles": {
     *          "zosmf": {
     *              "type": "zosmf",
     *              "properties": {
     *                  "basePath": "/api/v1"
     *              }
     *          },
     *          "ibmzosmf": {
     *              "type": "zosmf",
     *              "properties": {
     *                  "basePath": "/ibmzosmf/api/v1"
     *              }
     *          }
     *      },
     *      "defaults": {
     *          // Multiple services were detected.
     *          // Uncomment one of the lines below to set a different default
     *          //"zosmf": "ibmzosmf"
     *          "zosmf": "zosmf"
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
        // const configPlugins: Set<string> = new Set<string>();

        const _genCommentsHelper = (key: string, elements: string[]): string => {
            if (elements == null || elements.length === 0) return "";
            return `//"${key}": "${elements.length === 1 ? elements[0] : elements.join('"\n//"' + key + '": "')}"`;
        };

        profileInfoList?.forEach((profileInfo: IApimlProfileInfo) => {

            // TODO Add back in the future if we want plugins in team config
            // profileInfo.pluginConfigs.forEach((pluginInfo: IApimlSvcAttrsLoaded) => {
            //     configPlugins.add(pluginInfo.pluginName);
            // });

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
                const basePathConflicts = Object.keys(profileInfo.gatewayUrlConflicts);
                let conflictingPluginsList = "";
                basePathConflicts.forEach((element) => {
                    // The new-line before the // "element"  is required in order to properly format the comment-json object
                    conflictingPluginsList += `
                    //     "${element}": "${profileInfo.gatewayUrlConflicts[element].join('", "')}"`;
                });
                const basepathConflictMessage = `
                    // ---
                    // Warning: basePath conflict detected!
                    // Different plugins require different versions of the same API.
                    // List:${conflictingPluginsList}
                    // ---`;
                const noConflictMessage = `
                    // Multiple base paths were detected for this service.
                    // Uncomment one of the lines below to use a different one.`;
                configProfile.profiles[profileInfo.profName].properties = JSONC.parse(`
                    {
                        ${basePathConflicts.length > 0 ? basepathConflictMessage : noConflictMessage}
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

                configDefaults = JSONC.parse(`
                    ${JSONC.stringify(configDefaults, null, ConfigConstants.INDENT).slice(0, -1)}${Object.keys(configDefaults).length > 0 ? "," : ""}
                    // Multiple services were detected.
                    // Uncomment one of the lines below to set a different default.
                    ${_genCommentsHelper(defaultKey, conflictingDefaults[defaultKey])}
                    "${defaultKey}": "${trueDefault}"
                }`);
            }
        }

        const configResult: IConfig = {
            profiles: configProfile.profiles,
            defaults: configDefaults,
            autoStore: true
        };
        return configResult;
    }
}
