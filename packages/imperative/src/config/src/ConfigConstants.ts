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

/**
 * Constants related to team configuration
 */
export class ConfigConstants {
    /**
     * Number of spaces used for indentation in config JSONC files
     */
    public static readonly INDENT: number = 4;

    /**
     * A string used to hide the display of secure values
     */
    public static readonly SECURE_VALUE = "(secure value)";

    /**
     * ID used for storing secure credentials in vault
     */
    public static readonly SECURE_ACCT = "secure_config_props";

    /**
     * ID used for storing secure credentials in vault
     */
    public static readonly SKIP_PROMPT = "- Press ENTER to skip: ";
}
