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

import { EventTypes } from "../EventConstants";
import * as fs from "node:fs";

/**
 * Imperative Event JSON representation for user interpretation
 * @export
 * @interface IEventJson
 */
export interface IEventJson {
    /**
     * The time in which the event occurred
     */
    eventTime: string;
    /**
     * The name of event that occurred
     */
    eventName: string;
    /**
     * The application name that triggered the event
     */
    appName: string;
    /**
     * The file path for information on the emitted event
     */
    eventFilePath: string;
    /**
     * The type of event that occurred
     */
    eventType?: EventTypes;
    /**
     * List of watchers to eventually close
     */
    subscriptions?: fs.FSWatcher[];
}
