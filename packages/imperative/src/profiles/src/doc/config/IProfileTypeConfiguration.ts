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

import { IProfileSchema } from "../definition/IProfileSchema";
import { IProfileDependency } from "../definition/IProfileDependency";

/**
 * The profile "type" configuration document. Provides all configuration information for the "type". A profile
 * "type" is an arbirarty (implementation defined) category used to isolate configuration documents, provide
 * ease of configuration for complex CLIs (user only configures what they'll use), and allows the CLI to be
 * extendable in an isolated fashion. See the "IProfile" and "BasicProfileManager" for more detailed profile info.
 * @export
 * @interface IProfileTypeConfiguration
 */
export interface IProfileTypeConfiguration {
    /**
     * The name of the profile "type" (e.g. "banana"). The type should be indicative of the profile contents (defined
     * by the profile schema on this document). A "type" is analogous to a category.
     *
     * @type {string}
     * @memberof IProfileTypeConfiguration
     */
    type: string;
    /**
     * The JSON schema document. The schema document provides a way to enforce the contents of a profile. The schema
     * conforms exactly to the JSON schema specification. You must supply all properties you would like validated
     * for correctness on the schema, except for "dependencies". Dependency schema checking is generated automatically
     * if you populate the dependencies property of this document.
     *
     * @type {IProfileSchema}
     * @memberof IProfileTypeConfiguration
     */
    schema: IProfileSchema;
    /**
     * The version for the JSON schema document (not required).
     */
    schemaVersion?: string;
    /**
     * The profile dependency specification. Indicates the required or optional profiles that a profile is depedent
     * on. Dependencies are written as part of the profile, but you do NOT need to specify dependencies in your
     * schema document - this is automatically generated based on your specifications.
     *
     * @type {IProfileDependency[]}
     * @memberof IProfileTypeConfiguration
     */
    dependencies?: IProfileDependency[];
    /**
     * Path to a module that contains an object that matches the interface IProfileValidationPlan. This is optional,
     * but if provided a "validate profile" command will be generated to give the user a report on the validity of
     * their profile.
     *
     * @type {string}
     * @memberof IProfileTypeConfiguration
     */
    validationPlanModule?: string;
}
