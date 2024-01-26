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
 * Imperative Event JSON representation
 * @export
 * @interface IImperativeEventJson
 */
export interface IImperativeEventJson {
    /**
     * The time in which the event occurred
     */
    time: string;
    /**
     * The type of event that occurred
     */
    type: string;
    /**
     * The application name that triggered the event
     */
    source: string;
    /**
     * The ID of the event that occurred
     */
    id?: string;
    /**
     * The location in which the event was emitted (User vs Shared)
     */
    loc?: string;
    /**
     * The indicator of user-specific (if true) or shared (if false) events
     */
    user?: boolean;
}
