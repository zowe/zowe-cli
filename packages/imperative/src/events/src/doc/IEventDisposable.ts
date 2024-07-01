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
 * Defines a contract for objects that can dispose of resources typically associated with an event.
 * (Any object that implements this interface must provide an implementation of the close() method)
 * @export
 * @interface IEventDisposable
 */
export interface IEventDisposable {
    /**
     * Disposes of the actions registered to an event, effectively cleaning up or removing event handlers.
     * @memberof IEventDisposable
     */
    close(): void;
}
