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

import { ImperativeEventTypes } from "../ImperativeEventConstants";
import { FSWatcher } from "fs";

/**
 * Imperative Registered Action
 * @export
 * @interface IEventSubscriptionParms
 */
export interface IEventSubscriptionParms {
    /**
     * The type of event that occurred
     * @type {ImperativeEventTypes}
     * @memberof IEventSubscriptionParms
     */
    eventType?: ImperativeEventTypes
    /**
     * The time of the latest event occurrence
     * @type {string}
     * @memberof IEventSubscriptionParms
     */
    eventTime?: string
    /**
     * Specifies whether this is a custom shared event, necessary for extenders to set
     * @type {boolean}
     * @memberof IEventSubscriptionParms
     */
    isCustomShared?: boolean
    /**
     * Event dir for the .event file
     * Incomplete dir path to be joined with the current value stored in zoweDir
     * @type {string}
     * @memberof IEventSubscriptionParms
     */
    dir?: string;
    /**
     * The attached watcher for this subscription
     * @type {FSWatcher}
     * @memberof IEventSubscriptionParms
     */
    watcher?: FSWatcher
    /**
     * Functions to trigger upon event emission
     * @type {Function[]}
     * @memberof IEventSubscriptionParms
     */
    callbacks?: Function[]
}