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
 * Options that control how config values are redacted when exporting a
 * config layer for sharing or troubleshooting purposes.
 */
export interface IConfigExportRedactedOpts {
    /**
     * Redact string values with consistent keys.
     * @default true
     */
    redactStrings?: boolean;

    /**
     * Redact numeric values with consistent keys.
     * @default true
     */
    redactNumbers?: boolean;

    /**
     * Redact boolean values with consistent keys.
     * @default false
     */
    redactBooleans?: boolean;

    /**
     * Hide secure field names from output. Secure field names are shown by
     * default since they don't contain sensitive values.
     * @default false
     */
    hideSecureFields?: boolean;

    /**
     * Redact profile names and their references in the defaults section.
     * @default true
     */
    redactProfileNames?: boolean;

    /**
     * Show the host and basePath property values instead of redacting them.
     * Takes precedence over `redactStrings`.
     * @default false
     */
    showHostPath?: boolean;
}
