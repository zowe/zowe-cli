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

import { IProfileProperty } from "./IProfileProperty";

/**
 * The JSON Validation schema for your profile type.
 * Use this to describe the expected structure and contents of your profile,
 * as well as provide option definitions for create & update profile commands
 */
export interface IProfileSchema {
    /**
     * A short, descriptive title of your profile type
     */
    title: string;
    /**
     * A description of your type of profile
     */
    description: string;
    /**
     * Specify "object". This is not the type name
     * of the profile, but rather a description of the type of data structure (e.g. string,
     * array). Your profile will be an object with one or more properties.
     */
    type: string;
    /**
     * These are the properties of your profile object. If your profile deals with
     * information about bananas, some properties might be "color", "sweetness",
     * and "origin" of type "string". For each one, you can provide an Imperative
     * option definition (The same format as your normal command option definitions)
     * which will be used for auto-generating profile commands.
     */
    properties: {
        /**
         * General mapping of property name to an IProfileProperty object.
         */
        [key: string]: IProfileProperty,
    };

    /**
     * An array of properties that must be present in the finished profile.
     * If any of these fields are missing, profile validation will fail.
     */
    required?: string[];

    /**
     * Any other advanced options available from the JSON schema specification
     * http://json-schema.org/latest/json-schema-validation.html
     */
    [key: string]: any;
}
