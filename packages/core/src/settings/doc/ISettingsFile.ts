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

import { IImperativeOverrides } from "../../imperative/doc/IImperativeOverrides";

/**
 * This interface defines the structure of the settings file.
 */
export interface ISettingsFile {
    /**
     * The overrides object determines which items will be used for any overrides in
     * the overrides loader. Overrides can come from the base cli or plugins.
     */
    overrides: {
        /**
         * This object can have any key present in the {@link IImperativeOverrides} object
         * as a valid setting, allowing us to be dynamic.
         *
         * Possible Values
         * ---------------
         * false  - Use the default overrides defined by the base cli application. If
         *          the base application doesn't provide the override for this key,
         *          Imperative's default will be used.
         *
         * string - A string value indicates that there is an installed plugin that
         *          contains an overrides for this value. The string is the name of
         *          the plugin. If the plugin doesn't provide the override, a warning
         *          will be logged to the console, the value will be left unchanged
         *          and we will act as if the key was null.
         */
        [K in keyof IImperativeOverrides]-?: false | string; // All keys of IImperativeOverrides now become required
    };
}
