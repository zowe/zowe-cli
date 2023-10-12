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

import { IProfileTypeConfiguration } from "../config/IProfileTypeConfiguration";
import { AbstractProfileManager } from "../../abstract/AbstractProfileManager";
/**
 * Profile manager factory inteface - implemented by the abstract profile manager in this profiles
 * package and created by Imperative and other packages that need to influence the way the profile manager
 * is allocated, configured.
 * @export
 * @interface IProfileManagerFactory
 * @template T
 */
export interface IProfileManagerFactory<T extends IProfileTypeConfiguration> {
    /**
     * Returns an instance of the profile manager specific to the "type" passed - types are defined by Imeprative
     * configuration/init
     * @param {string} type - The profile type.
     * @returns {AbstractProfileManager<T>} - An instance of the profile manager.
     * @memberof IProfileManagerFactory
     */
    getManager(type: string): AbstractProfileManager<T>;
}
