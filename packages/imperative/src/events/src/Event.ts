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

import { FSWatcher } from "node:fs";
import { EventTypes } from "./EventConstants";
import { IEventJson } from "./doc";

/**
 * Represents an event within the system, containing all necessary metadata
 * and subscriptions related to the event.
 */
export class Event implements IEventJson {
    public eventTime: string;
    public eventName: string;
    public eventType: EventTypes;
    public appName: string;
    public appProcId: number;
    public eventFilePath: string;
    public subscriptions: FSWatcher[];


    /**
     * Initializes a new instance of the Event class with specified properties.
     *
     * @param {IEventJson} params - The parameters to create the Event.
     */
    constructor({ eventTime, eventName, eventType, appName, eventFilePath, subscriptions }: IEventJson) {
        this.eventTime = eventTime;
        this.eventName = eventName;
        this.eventType = eventType ?? null;
        this.appName = appName;
        this.eventFilePath = eventFilePath;
        this.subscriptions = subscriptions;
    }

    /**
     * Serializes the Event object to a JSON object for storage or transmission.
     *
     * @returns {Object} The JSON representation of the event.
     */
    public toJson(): IEventJson {
        return {
            eventTime: this.eventTime,
            eventName: this.eventName,
            eventType: this.eventType,
            appName: this.appName,
            eventFilePath: this.eventFilePath,
        };
    }

    /**
     * Provides a string representation of the Event, useful for logging and debugging.
     *
     * @returns {string} A string detailing the event's significant information.
     */
    public toString = (): string => {
        return `Name: ${this.eventName} \t| Time: ${this.eventTime} \t| App: ${this.appName} \t| Type: ${this.eventType}`;
    };
}