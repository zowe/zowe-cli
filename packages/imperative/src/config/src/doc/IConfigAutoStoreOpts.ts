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

import { ICommandArguments } from "../../../cmd/src/doc/args/ICommandArguments";
import { IHandlerParameters } from "../../../cmd/src/doc/handler/IHandlerParameters";
import { Config } from "../Config";

/**
 * Defines the options used by the ConfigAutoStore._findActiveProfile function
 */
export interface IConfigAutoStoreFindActiveProfileOpts {
    /**
     * CLI Handler Parameters to use when searching for the active profile
     */
    params?: IHandlerParameters;

    /**
     * List of properties required in the profile schema
     */
    profileProps?: string[];

    /**
     * Optional profile types to look for
     * Used if params == null
     */
    profileTypes?: string[];

    /**
     * Default profile name used if no profiles matched the search for active profiles
     * Used if params == null
     */
    defaultProfileName?: string;
}

/**
 * Defines the options used by the ConfigAutoStore._findAuthHandlerForProfile function
 * @extends IConfigAutoStoreFindActiveProfileOpts Needed to fulfill all requirements of _storeSessCfgProps
 */
export interface IConfigAutoStoreFindAuthHandlerForProfileOpts extends IConfigAutoStoreFindActiveProfileOpts {
    /**
     * JSON path of profile
     */
    profilePath?: string;

    /**
     * CLI arguments which may specify a profile
     */
    cmdArguments?: ICommandArguments;

    /**
     * Default base profile name
     * Used if cmdArguments == null
     */
    defaultBaseProfileName?: string;

    /**
     * Team configuration properties
     * Overrides `ImperativeConfig.instance.config`
     */
    config?: Config;
}

/**
 * Defines the options used by the ConfigAutoStore._storeSessCfgProps function
 * @extends IConfigAutoStoreFindAuthHandlerForProfileOpts
 */
export interface IConfigAutoStoreStoreSessCfgPropsOpts extends IConfigAutoStoreFindAuthHandlerForProfileOpts {
    /**
     * Session config containing properties to store
     */
    sessCfg?: { [key: string]: any };

    /**
     * Names of properties that should be stored
     */
    propsToStore?: string[];

    /**
     * Name of the profile where we want to store the properties
     * Used if params == null
     */
    profileName?: string;

    /**
     * Type of the profile where we want to store the properties
     * Used if params == null
     */
    profileType?: string;

    /**
     * Indicates whether or not the property should be stored securely
     */
    setSecure?: boolean;
}

