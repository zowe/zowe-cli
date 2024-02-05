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
import { ICommandExampleDefinition } from "../../ICommandExampleDefinition";
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
     * A handler module which Imperative will require().
     * The module's default export should be a  handler that calls
     * appendResponseObject on the provided commandParameters.response
     * You do NOT have to implement writing the profile to disk -- you only have to produce
     * the final profile object that you would like to be written.
     *
     *
     * This is only required if finished profile can't be created directly from the arguments, e.g.
     * if you have --user and --password and need to always transform it into a basic auth
     *
     *
     * If omitted, Imperative will just write all fields present from the schema into the profile
     * without requiring a module
     *
     * @type {string}
     * @memberof IProfileTypeConfiguration
     */
    createProfileFromArgumentsHandler?: string;
    /**
     * Examples to be displayed in the help text for the auto generated create profile command.
     *
     * @type {ICommandExampleDefinition[]}
     * @memberof IProfileTypeConfiguration
     */
    createProfileExamples?: ICommandExampleDefinition[];

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
