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
    public eventTime: string;
    public eventName: string;
    public eventType: EventTypes;
    public appName: string;
    public filePath: string;
    public subscriptions: FSWatcher[];

    constructor({ eventTime, eventName, eventType, appName, filePath: eventFilePath, subscriptions }: IEventJson) {
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

    /**
     * toString overload to be called automatically on string concatenation
     * @returns string representation of the imperative event
     */
    public toString = (): string => {
        return `Name: ${this.eventName} \t| Time: ${this.eventTime} \t| App: ${this.appName} \t| Type: ${this.eventType}`;
    };
}