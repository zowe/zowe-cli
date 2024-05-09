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

/**
 * The meta profile is saved in each of the profile "type" directories under the profile manager root directory.
 * The meta profile is always named "<type>_meta" and is always stored in YAML format. The contents contain the
 * default profile for the type AND the configuration document for the type. The configuration document is persisted
 * to allow external callers of the Profile Manager APIs (outside of an Imperative init'd environment) to load/save
 * profiles (useful for programmatic invocation from editor plugins, such as VS Code).
 * @export
 * @interface IMetaProfile
 */
export interface IMetaProfile<T extends IProfileTypeConfiguration> {
    /**
     * The default profile for the "type" - this profile will be loaded by the manager if the default is requested.
     * This is a convience for users of the CLI (and programmatic invocation) to avoid having to supply a profile
     * name for the type. You can also set the default using the Profile Manager APIs.
     *
     * @memberof IMetaProfile
     */
    defaultProfile: string;
    /**
     * The Configuration Document supplied for this type.
     * @type {T}
     * @memberof IMetaProfile
     */
    configuration: T;
}
