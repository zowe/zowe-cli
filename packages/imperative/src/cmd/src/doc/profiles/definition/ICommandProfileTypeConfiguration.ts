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

import { ICommandProfileSchema } from "./ICommandProfileSchema";
import { IProfileTypeConfiguration } from "../../../../..";
import { ICommandProfileAuthConfig } from "./ICommandProfileAuthConfig";

/**
 * Cmd packages additions to the profile manager type configuration document. Used by the CliProfileManager. Allows
 * profiles to be built from command arguments. See the "CliProfileManager" for more information.
 * @export
 * @interface ICommandProfileTypeConfiguration
 * @extends {IProfileTypeConfiguration}
 */
export interface ICommandProfileTypeConfiguration extends IProfileTypeConfiguration {
    /**
     * The JSON schema document. The schema document provides a way to enforce the contents of a profile. The schema
     * conforms exactly to the JSON schema specification. You must supply all properties you would like validated
     * for correctness on the schema, except for "dependencies". Dependency schema checking is generated automatically
     * if you populate the dependencies property of this document.
     *
     * @type {ICommandProfileSchema}
     */
    schema: ICommandProfileSchema;

    /**
     * Configuration for authentication services to associate with this profile type.
     */
    authConfig?: ICommandProfileAuthConfig[];
}
