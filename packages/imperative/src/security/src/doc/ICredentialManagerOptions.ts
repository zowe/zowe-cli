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
 * Options that can be passed to a credential manager during initialization.
 * These options allow configuration of credential manager behavior without
 * relying on environment variables.
 *
 * The structure and content of these options depends on the specific
 * credential manager implementation being used.
 *
 * @example
 * // Example for Windows credential persistence configuration
 * const options: ICredentialManagerOptions = {
 *   persist: "enterprise"
 * };
 *
 * @example
 * // Example for a custom credential manager's configuration
 * const options: ICredentialManagerOptions = {
 *   timeout: 5000,
 *   retryAttempts: 3,
 *   enableLogging: true
 * };
 */
export type ICredentialManagerOptions = { [key: string]: any };
