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

import { AbstractCredentialManager } from "../abstract/AbstractCredentialManager";

/**
 * This interface defines the constructor for a credential manager. This is used by the TypeScript
 * compiler to verify that any class that wishes to be a Credential Manager adheres to the constructor
 * arguments sent to it.
 *
 * Your class will satisfy this interface when all the following are true:
 *  1. Your class extends {@link AbstractCredentialManager}
 *  2. Your constructor has less than or equal to the number of parameters specified in the interface
 *  3. Your constructor has matching parameter types for all parameters accepted
 */
export type ICredentialManagerConstructor = new(cliName: string, displayName: string) => AbstractCredentialManager;
/**
     * The constructor function for a Credential Manager. All the parameters specified here
     * will be sent in during the {@link CredentialManagerFactory.initialize} function.
     *
     * @param {string} cliName - The name of the cli. The default manager uses this as the service.
     * @param {string} displayName - The manager display name. For messaging/debugging.
     *
     * @returns {AbstractCredentialManager} - An instantiated class that extends {@link AbstractCredentialManager}
     */
