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

import { ICommandOptionDefinition } from "../../../../../cmd";

export class AutoInitConstants {
    public static AUTO_INIT_OPTION_GROUP = "Automatic Config Initialization Options";

    /**
     * Option used to specify whether or not to use the user layer of the config
     */
    public static AUTO_INIT_OPTION_USER_CONFIG: ICommandOptionDefinition = {
        name: "user-config",
        aliases: ["uc"],
        description: "Save config in the user layer",
        type: "boolean",
        defaultValue: false,
        group: AutoInitConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used to specify whether or not to use the global layer of the config
     */
    public static AUTO_INIT_OPTION_GLOBAL_CONFIG: ICommandOptionDefinition = {
        name: "global-config",
        aliases: ["gc"],
        description: "Save config in the global layer",
        type: "boolean",
        defaultValue: false,
        group: AutoInitConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used to specify whether or not to do a dry run of the initialization
     */
    public static AUTO_INIT_OPTION_DRY_RUN: ICommandOptionDefinition = {
        name: "dry-run",
        aliases: ["dr", "dry"],
        description: "Display the outcome of the initialization without saving",
        type: "boolean",
        conflictsWith: ["edit"],
        group: AutoInitConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used to specify whether or not to open an editor for the config
     */
    public static AUTO_INIT_OPTION_EDIT: ICommandOptionDefinition = {
        name: "edit",
        aliases: ["e"],
        description: "Open in editor after initializing the configuration",
        type: "boolean",
        conflictsWith: ["dry-run"],
        group: AutoInitConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used to specify whether or not to overwrite the config
     */
    public static AUTO_INIT_OPTION_OVERWRITE: ICommandOptionDefinition = {
        name: "overwrite",
        aliases: ["ow"],
        description: "Replaces an existing configuration with a new configuration",
        type: "boolean",
        defaultValue: false,
        group: AutoInitConstants.AUTO_INIT_OPTION_GROUP,
        implies: ["for-sure"]
    };

    /**
     * Option used to confirm an overwrite
     */
    public static AUTO_INIT_OPTION_FOR_SURE: ICommandOptionDefinition = {
        name: "for-sure",
        aliases: ["f"],
        description: "Confirms the overwrite option",
        type: "boolean",
        defaultValue: false,
        group: AutoInitConstants.AUTO_INIT_OPTION_GROUP
    };
}
