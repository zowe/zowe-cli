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

import { AbstractProfileManagerFactory } from "./abstract/AbstractProfileManagerFactory";
import { IProfileTypeConfiguration } from "./doc/config/IProfileTypeConfiguration";
import { BasicProfileManager } from "./BasicProfileManager";

/**
 * A basic profile mananger factory - returns instances of profile managers depending on the types passed.
 * @export
 * @class BasicProfileManagerFactory
 * @extends {AbstractProfileManagerFactory<IProfileTypeConfiguration>}
 */
export class BasicProfileManagerFactory extends AbstractProfileManagerFactory<IProfileTypeConfiguration> {
    /**
     * The root directory where the profiles will be found.
     * @private
     * @type {string}
     * @memberof BasicProfileManagerFactory
     */
    private mProfilesRootDirectory: string;

    /**
     * Type configurations for the basic profile manager
     * @private
     * @type {IProfileTypeConfiguration[]}
     * @memberof BasicProfileManagerFactory
     */
    private mTypeConfigurations: IProfileTypeConfiguration[];

    /**
     * Creates an instance of BasicProfileManagerFactory.
     * @param {string} profilesRootDirectory - The root directory to find your profiles
     * @memberof BasicProfileManagerFactory
     */
    constructor(profilesRootDirectory: string, typeConfigurations?: IProfileTypeConfiguration[]) {
        super();
        this.mProfilesRootDirectory = profilesRootDirectory;
        this.mTypeConfigurations = typeConfigurations;
    }

    /**
     * Returns a new instance of the basic profile manager for the type.
     * @param {string} type - the profile type to manager.
     * @returns {BasicProfileManager<IProfileTypeConfiguration>} - The profile manager instance for the type.
     * @memberof BasicProfileManagerFactory
     */
    public getManager(type: string): BasicProfileManager<IProfileTypeConfiguration> {
        return new BasicProfileManager({
            type,
            profileRootDirectory: this.profilesRootDirectory,
            typeConfigurations: this.typeConfigurations
        });
    }

    /**
     * Accessor for the profiles root directory
     * @readonly
     * @private
     * @type {string}
     * @memberof BasicProfileManagerFactory
     */
    private get profilesRootDirectory(): string {
        return this.mProfilesRootDirectory;
    }

    /**
     * Accessor for the type configurations
     * @readonly
     * @private
     * @type {IProfileTypeConfiguration[]}
     * @memberof BasicProfileManagerFactory
     */
    private get typeConfigurations(): IProfileTypeConfiguration[] {
        return this.mTypeConfigurations;
    }
}
