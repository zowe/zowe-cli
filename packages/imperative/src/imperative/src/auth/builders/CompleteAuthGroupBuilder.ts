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

import { ICommandDefinition } from "../../../../cmd";
import {
    authCategoryDesc, authCategorySummary,
    authLoginGroupDesc, authLoginGroupSummary,
    authLogoutGroupDesc, authLogoutGroupSummary
} from "../../../../messages";
import { Constants } from "../../../../constants";
import { AuthLoginCommandBuilder } from "./AuthLoginCommandBuilder";
import { AuthLogoutCommandBuilder } from "./AuthLogoutCommandBuilder";
import { Logger } from "../../../../logger/index";
import { ICommandProfileAuthConfig } from "../../../../cmd/src/doc/profiles/definition/ICommandProfileAuthConfig";
import { IImperativeAuthGroupConfig } from "../../doc/IImperativeAuthGroupConfig";

/**
 * Generate a complete group of commands for logging in and out of services
 * based on provided auth definitions.
 */
export class CompleteAuthGroupBuilder {
    /**
     * Get the complete auth group of commands
     * @param {[key: string]: ICommandProfileAuthConfig} authConfigs - mapping of profile types to auth configs
     * @param {Logger} logger - logger to use in the builder classes
     * @param {IImperativeAuthGroupConfig} authGroupConfig - config that allows command definitions to be overridden
     * @returns {ICommandDefinition} - the complete profile group of commands
     */
    public static getAuthGroup(authConfigs: {[key: string]: ICommandProfileAuthConfig[]},
        logger: Logger,
        authGroupConfig: IImperativeAuthGroupConfig = {}): ICommandDefinition {
        const authGroup: ICommandDefinition = {...this.defaultAuthGroup, ...authGroupConfig.authGroup};
        const loginGroup: ICommandDefinition = {...this.defaultLoginGroup, ...authGroupConfig.loginGroup};
        const logoutGroup: ICommandDefinition = {...this.defaultLogoutGroup, ...authGroupConfig.logoutGroup};

        for (const profileType of Object.keys(authConfigs)) {
            for (const authConfig of authConfigs[profileType]) {
                const loginCommandAction = new AuthLoginCommandBuilder(profileType, logger, authConfig);
                const logoutCommandAction = new AuthLogoutCommandBuilder(profileType, logger, authConfig);
                loginGroup.children.push(loginCommandAction.build());
                logoutGroup.children.push(logoutCommandAction.build());
            }
        }
        authGroup.children.push(loginGroup, logoutGroup);
        return authGroup;
    }

    private static defaultAuthGroup: ICommandDefinition = {
        name: Constants.AUTH_GROUP,
        summary: authCategorySummary.message,
        description: authCategoryDesc.message,
        type: "group",
        children: []
    };

    private static defaultLoginGroup: ICommandDefinition = {
        name: Constants.LOGIN_ACTION,
        description: authLoginGroupDesc.message,
        summary: authLoginGroupSummary.message,
        aliases: ["li"],
        type: "group",
        children: [],
    };

    private static defaultLogoutGroup: ICommandDefinition = {
        name: Constants.LOGOUT_ACTION,
        description: authLogoutGroupDesc.message,
        summary: authLogoutGroupSummary.message,
        aliases: ["lo"],
        type: "group",
        children: [],
    };
}
