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

import { AbstractSession, IConfigProfile, ImperativeError, ImperativeExpect, Logger, RestConstants, SessConstants } from "@zowe/imperative";
import { ZosmfRestClient } from "../rest/ZosmfRestClient";
import { ApimlConstants } from "./ApimlConstants";
import { IApimlProfileInfo } from "./doc/IApimlProfileInfo";
import { IApimlService } from "./doc/IApimlService";
import { IPluginApimlConfig } from "./doc/IPluginApimlConfig";

/**
 * Class to handle listing services on APIML gateway.
 * @export
 * @class Services
 */
export class Services {
    public static getPluginApimlConfigs(): IPluginApimlConfig[] {
        return;
    }

    /**
     * Perform APIML login to obtain LTPA2 or other token types.
     * @static
     * @param {AbstractSession} session
     * @returns
     * @memberof Login
     */
    public static async getServicesByConfig(session: AbstractSession, configs: IPluginApimlConfig[]): Promise<IApimlProfileInfo[]> {
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

        const response: IApimlService[] = JSON.parse(client.dataString);
        const output: IApimlProfileInfo[] = [];
        for (const service of response) {
            if (service.apiml.authentication[0]?.supportsSso) {
                outer:
                for (const config of configs) {
                    for (const apiInfo of service.apiml.apiInfo) {
                        if (apiInfo.apiId === config.apiId && apiInfo.gatewayUrl === config.gatewayUrl) {
                            output.push({
                                name: service.serviceId,
                                type: config.profileType,
                                // TODO Handle multiple base paths
                                basePaths: [apiInfo.basePath]
                            });
                            break outer;
                        }
                    }
                }
            }
        }

        return output;
    }

    public static convertApimlProfileInfoToProfileConfig(profileInfo: IApimlProfileInfo[]): IConfigProfile[] {
        return;
    }
}
