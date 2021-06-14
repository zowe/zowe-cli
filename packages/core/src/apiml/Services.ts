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

import {
    AbstractSession, IConfigProfile, ImperativeConfig, ImperativeError,
    ImperativeExpect, Logger, PluginManagementFacility, RestConstants, SessConstants
} from "@zowe/imperative";
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
        await client.request({
            request: "GET",
            resource: ApimlConstants.SERVICES_ENDPOINT
        });

        if (client.response.statusCode !== RestConstants.HTTP_STATUS_200) {
            throw new ImperativeError((client as any).populateError({
                msg: `REST API Failure with HTTP(S) status ${client.response.statusCode}`,
                causeErrors: client.dataString,
                source: SessConstants.HTTP_PROTOCOL
            }));
        }

        const profInfos: IApimlProfileInfo[] = [];
        for (const service of JSON.parse(client.dataString) as IApimlService[]) {
            if (service.apiml.authentication[0]?.supportsSso) {
                let profInfo: IApimlProfileInfo;
                for (const config of configs) {
                    for (const apiInfo of service.apiml.apiInfo) {
                        if (apiInfo.apiId === config.apiId && apiInfo.gatewayUrl === config.gatewayUrl) {
                            // TODO Ensure base paths are ordered correctly
                            if (profInfo == null) {
                                profInfo = {
                                    profName: service.serviceId,
                                    profType: config.connProfType,
                                    basePaths: [apiInfo.basePath]
                                }
                            } else {
                                profInfo.basePaths.push(apiInfo.basePath);
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

        return profInfos;
    }

    public static convertApimlProfileInfoToProfileConfig(profileInfo: IApimlProfileInfo[]): IConfigProfile[] {
        return;
    }
}
