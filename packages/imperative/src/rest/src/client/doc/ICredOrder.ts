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
 * This enum can be used to specify the order in which credentials will be used when
 * multiple types of credentials exist in the zowe client configuration.
 */
export enum ICredOrder {
    PASSWORD_OVER_TOKEN,    // Choose user & password over token.
    TOKEN_OVER_PASSWORD     // Choose token over user & password.
}