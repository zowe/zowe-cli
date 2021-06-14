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

import { AbstractSession, IConfigProfile, ImperativeConfig, ImperativeError, ImperativeExpect, Logger,
    PluginManagementFacility, RestConstants, SessConstants } from "@zowe/imperative";
import { ZosmfRestClient } from "../rest/ZosmfRestClient";
import { ApimlConstants } from "./ApimlConstants";
import { IApimlProfileInfo } from "./doc/IApimlProfileInfo";
import { IApimlService } from "./doc/IApimlService";
import { IApimlSvcAttrsLoaded } from "./doc/IApimlSvcAttrsLoaded";

/**
 * Class to handle listing services on APIML gateway.
 * @export
 * @class Services
 */
export class Services {
    public static getPluginApimlConfigs(): IApimlSvcAttrsLoaded[] {
        return;
    }

    /**
     * Perform APIML login to obtain LTPA2 or other token types.
     * @static
     * @param {AbstractSession} session
     * @returns
     * @memberof Login
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

        const client = new ZosmfRestClient(session);
        // TODO What about getExpectJSON?
        await client.request({
            request: "GET",
            resource: ApimlConstants.SERVICES_ENDPOINT
        });

        // TODO Is it safe to assume good response code always 200?
        if (client.response.statusCode !== RestConstants.HTTP_STATUS_200) {
            throw new ImperativeError((client as any).populateError({
                msg: `REST API Failure with HTTP(S) status ${client.response.statusCode}`,
                causeErrors: client.dataString,
                source: SessConstants.HTTP_PROTOCOL
            }));
        }

        // Get profile info for APIML services that match the CLI's APIML service attributes
        const profInfos: IApimlProfileInfo[] = [];
        for (const service of JSON.parse(client.dataString) as IApimlService[]) {
            if (service.apiml.authentication[0]?.supportsSso) {
                let profInfo: IApimlProfileInfo;
                let matchedGatewayUrl = false;
                for (const config of configs) {
                    for (const apiInfo of service.apiml.apiInfo) {
                        if (apiInfo.apiId === config.apiId) {
                            if (profInfo == null) {
                                profInfo = {
                                    profName: service.serviceId,
                                    profType: config.connProfType,
                                    basePaths: [apiInfo.basePath],
                                    pluginConfigs: [config],
                                    conflictTypes: []
                                };
                            } else {
                                if (apiInfo.gatewayUrl === config.gatewayUrl) {
                                    // Don't always add to front of list
                                    profInfo.basePaths.unshift(apiInfo.basePath);
                                    matchedGatewayUrl = true;
                                } else if (apiInfo.defaultApi && !matchedGatewayUrl) {
                                    profInfo.basePaths.unshift(apiInfo.basePath);
                                } else {
                                    profInfo.basePaths.push(apiInfo.basePath);
                                }
                                profInfo.pluginConfigs.push(config);
                            }
                        }
                    }
                    if (profInfo != null) {
                        profInfos.push(profInfo);
                        break;
                    }
                }
            }
        }

        // Find conflicts in profile info array
        for (const profInfo of profInfos) {
            const gatewayUrlsByPlugin: { [key: string]: Set<string> } = {};
            for (const pluginCfg of profInfo.pluginConfigs.filter(cfg => cfg.gatewayUrl)) {
                gatewayUrlsByPlugin[pluginCfg.pluginName] = new Set([
                    ...(gatewayUrlsByPlugin[pluginCfg.pluginName] || []),
                    pluginCfg.gatewayUrl
                ]);
            }
            const gatewayUrls = new Set(Object.values(gatewayUrlsByPlugin));
            if (gatewayUrls.size > 1) {
                profInfo.conflictTypes.push("gatewayUrl");
            }

            if (profInfos.filter(info => info.profType === profInfo.profType).length > 1) {
                profInfo.conflictTypes.push("serviceId");
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
    public static convertApimlProfileInfoToProfileConfig(profileInfoList: IApimlProfileInfo[]): IConfigProfile {
        const configProfile: IConfigProfile = {
            properties: {},
            profiles: {}
        };

        profileInfoList.forEach((profileInfo: IApimlProfileInfo) => {
            configProfile.profiles[profileInfo.profName] = {
                type: profileInfo.profType,
                properties: {}
            };

            const basePaths: string[] = JSON.parse(JSON.stringify(profileInfo.basePaths));
            if (basePaths.length === 1) {
                configProfile.profiles[profileInfo.profName].properties.basePath = basePaths[0];
            } else if (basePaths.length > 1) {
                const JSONC = require("comment-json");
                configProfile.profiles[profileInfo.profName].properties = JSONC.parse(`
                    {
                        // Multiple base paths were detected for this service.
                        // Uncomment one of the lines below to use a different one.
                        "basePath": "${basePaths.shift()}"
                        //"basePath": "${basePaths.length === 1 ? basePaths[0] : basePaths.join('"\n//"basePath": "')}"
                    }`
                );
            }
        });
        return configProfile;
    }
}
