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

import { FSWatcher } from "fs";
import { EventTypes } from "./EventConstants";
import { IEventJson } from "./doc";

export class Event implements IEventJson {
    eventTime: string;
    eventName: string;
    eventType: EventTypes;
    appName: string;
    filePath: string;
    subscriptions: FSWatcher[];

    constructor({ eventTime, eventName, eventType, appName, filePath: eventFilePath, subscriptions}: IEventJson) {
        this.eventTime = eventTime;
        this.eventName = eventName;
        this.eventType = eventType;
        this.appName = appName;
        this.filePath = eventFilePath;
        this.subscriptions = subscriptions;
    }

    public toJson() {
        return {
            eventTime: this.eventTime,
            eventName: this.eventName,
            eventType: this.eventType,
            appName: this.appName,
            eventFilePath: this.filePath
        };
    }
}