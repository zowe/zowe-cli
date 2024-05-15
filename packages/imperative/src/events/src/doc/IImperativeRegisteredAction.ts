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
 * Imperative Registered Action
 * @export
 * @interface IImperativeRegisteredAction
 */
export interface IImperativeRegisteredAction {
    /**
     * The method to dispose of the registered action
     * @memberof IImperativeRegisteredAction
     */
    close(): void;
}
