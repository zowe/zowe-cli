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

import { IPropertiesInput } from "../../doc/input/IPropertiesInput";

/**
 * Interface for provisioning the template command of the z/OSMF parameters.
 * @export
 * @interface IProvisionOptionals
 */
export interface IProvisionOptionals {
    /**
     * Runtime property objects.
     * @type {IPropertiesInput[]}
     * @memberof IProvisionOptionals
     */
    "input-variables": IPropertiesInput[];

    /**
     * Name of the domain.
     * @type {string}
     * @memberof IProvisionOptionals
     */
    "domain-name": string;

    /**
     * Name of the tenant.
     * @type {string}
     * @memberof IProvisionOptionals
     */
    "tenant-name": string;

    /**
     * ID for the user data specified with user-data.
     * @type {string}
     * @memberof IProvisionOptionals
     */
    "user-data-id": string;

    /**
     * Account information to use in the JCL JOB statement.
     * @type {string}
     * @memberof IProvisionOptionals
     */
    "account-info": string;

    /**
     * User data that is passed into the software services registry.
     * @type {string}
     * @memberof IProvisionOptionals
     */
    "user-data": string;

    /**
     * Nicknames of the systems upon which to provision the template.
     * @type {string[]}
     * @memberof IProvisionOptionals
     */
    "systems-nicknames": string[];
}
