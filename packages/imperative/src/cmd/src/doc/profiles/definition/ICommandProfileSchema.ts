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

import { ICommandProfileProperty } from "./ICommandProfileProperty";
import { IProfileSchema } from "../../../../../profiles";
/**
 * Externally exposed version of the profile schema with command options for auto-generated commands
 * @export
 * @interface ICommandProfileSchema
 * @extends {IProfileSchema}
 */
export interface ICommandProfileSchema extends IProfileSchema {
    /**
     * Command version of the properties field on the schema
     */
    properties: {
        /**
         * General mapping of property name to an ICommandProfileProperty object.
         * ICommandProfileProperty is the same as IProfileProperty except
         * that it can contain option definitions for auto-generated commands
         */
        [key: string]: ICommandProfileProperty,
    };
}
