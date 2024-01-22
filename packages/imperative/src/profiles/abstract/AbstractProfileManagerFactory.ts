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

import { AbstractProfileManager } from "./AbstractProfileManager";
import { IProfileTypeConfiguration } from "../doc/config/IProfileTypeConfiguration";
import { IProfileManagerFactory } from "../doc/api/IProfileManagerFactory";
/**
 * Abstract profile manager (implemented by imperative, etc.)
 * @export
 * @abstract
 * @class AbstractProfileManagerFactory
 * @implements {IProfileManagerFactory<T>}
 * @template T
 */
export abstract class AbstractProfileManagerFactory<T extends IProfileTypeConfiguration> implements IProfileManagerFactory<T> {
    /**
     * Returns and instance of the profile manager for the type specified.
     * @abstract
     * @param {string} type - the profile type
     * @returns {AbstractProfileManager<T>} - The manager
     * @memberof AbstractProfileManagerFactory
     */
    public abstract getManager(type: string): AbstractProfileManager<T>;
}
