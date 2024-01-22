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

import { AbstractProfileManagerFactory } from "../../profiles";
import { CliProfileManager, ICommandProfileTypeConfiguration } from "../../cmd/";
import { ImperativeApi } from "../api/ImperativeApi";
/**
 * The imperative profile manager factory returns instances of the cli profile manager
 * @export
 * @class ProfileManagerFactory
 * @extends {AbstractProfileManagerFactory<ICommandProfileTypeConfiguration>}
 */
export class ImperativeProfileManagerFactory extends AbstractProfileManagerFactory<ICommandProfileTypeConfiguration> {
    private mImperativeApi: ImperativeApi;
    constructor(imperativeApi: ImperativeApi) {
        super();
        this.mImperativeApi = imperativeApi;
    }
    /**
     * Returns a instance of the CliProfileManager
     * @param {string} type - The profile type you want to manage.
     * @returns {CliProfileManager} - The profile manager instance
     * @memberof ProfileManagerFactory
     */
    public getManager(type: string): CliProfileManager {
        return this.mImperativeApi.profileManager(type);
    }
}
