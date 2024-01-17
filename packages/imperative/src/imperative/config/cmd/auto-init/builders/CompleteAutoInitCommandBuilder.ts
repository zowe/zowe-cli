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

import { ICommandDefinition } from "../../../../../../src/cmd";
import { AutoInitCommandBuilder } from "./AutoInitCommandBuilder";
import { Logger } from "../../../../../../src/logger/index";
import { ICommandProfileAutoInitConfig } from "../../../../../../src/cmd/doc/profiles/definition/ICommandProfileAutoInitConfig";

/**
 * Generate a complete command for automatic initialization of a user configuration
 */
export class CompleteAutoInitCommandBuilder {
    /**
     * Get the complete auth group of commands
     * @param {ICommandProfileAutoInitConfig} autoInitConfig - mapping of profile types to auto init configs
     * @param {Logger} logger - logger to use in the builder classes
     * @returns {ICommandDefinition} - the complete profile group of commands
     */
    public static getAutoInitCommand(autoInitConfig: ICommandProfileAutoInitConfig,
        logger: Logger): ICommandDefinition {
        const autoInitCommandAction = new AutoInitCommandBuilder(logger, autoInitConfig, autoInitConfig.profileType);
        return autoInitCommandAction.build();
    }
}
