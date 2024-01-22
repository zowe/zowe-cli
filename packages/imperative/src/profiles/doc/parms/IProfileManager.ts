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

/**
 * Constructor parameters for the Profile Manager - Populated by the Imperative API methods (if invoked from your CLI app) OR you can
 * invoke the manager directly (assuming you supply all required parms).
 * @export
 * @interface IProfileManager
 */
import { Logger } from "../../../logger";
import { IProfileTypeConfiguration } from "../config/IProfileTypeConfiguration";

export interface IProfileManager<T extends IProfileTypeConfiguration> {
    /**
     * The profiles directory (normally obtained from the Imperative config). The profile root directory contains
     * a list of type directories, within each will be the profiles of that type and the meta file. The meta file
     * for a type contains the default specifications and the profile type configuration document. Use the "initialize"
     * API method on the Profile Manager to create the appropriate structure based on your configuration documents.
     *
     * @type {string}
     * @memberof IProfileManager
     */
    profileRootDirectory: string;
    /**
     * The profile type for this manager - the configuration document for the type can either be supplied on the
     * "typeConfigurations" property on this object OR the mananger will attempt to extract it from the profile
     * root directory type meta file. If the type configuration cannot be located, an exception will be thrown.
     *
     * @type {string}
     * @memberof IProfileManager
     */
    type: string;
    /**
     * The logger object to use in the profile manager. Normally the imperative logger, but can be any
     * arbitrary log4js logger.
     *
     * @type {Logger}
     * @memberof IProfileManager
     */
    logger?: Logger;
    /**
     * Contains all profile type configuration documents - used to obtain the schema for the profile type passed on the
     * profile manager and for dependency loading of profiles of other types.
     *
     * If this parameter is NOT supplied to the constructor of the Profile Manager, the manager will attempt to read
     * the configurations from each of the profile type meta files when the object is being instaitiated. If it fails
     * to locate a configuration for the profile type specified, manager creation will fail. You can either supply
     * the configurations to the constructor OR execute the "initialize" static API to create all type directories and
     * their meta configuration files.
     *
     * @type {IImperativeProfileConfig[]}
     * @memberof IProfileManager
     */
    typeConfigurations?: T[];

    /**
     * Map of which profile types have been loaded so far, to avoid circular profile loads
     * Used internally by profile manager classes
     */
    loadCounter?: Map<string, number>;

    /**
     * Product display name of CLI
     * @type {string}
     * @memberof IProfileManager
     */
    productDisplayName?: string;
}
