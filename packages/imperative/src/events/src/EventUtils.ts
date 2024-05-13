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

import { ImperativeError } from "../../error/src/ImperativeError";
import { dirname, join } from "path";
import { UserEvents, SharedEvents, EventTypes } from "./EventConstants";
import * as fs from "fs";
import { ConfigUtils } from "../../config/src/ConfigUtils";
import { IRegisteredAction } from "./doc";
import { Event } from "./Event";
import { EventEmitter } from "./EventEmitter";

/**
 * A collection of helper functions related to event management, including:
 * - directory management
 * - event type determination
 * - subscription creation and setting callbacks
 * - event writing
 */
export class EventUtils {

    /**
    * Determines if the specified event name is a user event.
    *
    * @param {string} eventName
    * @return {boolean}
    */
    public static isUserEvent(eventName: string): boolean {
        return Object.values<string>(UserEvents).includes(eventName);
    }

    /**
     * Determines if the specified event name is a shared event.
     *
     * @param {string} eventName
     * @return {boolean}
     */
    public static isSharedEvent(eventName: string): boolean {
        return Object.values<string>(SharedEvents).includes(eventName);
    }

    /**
     * Retrieves the directory path for events based on the event type and application name.
     *
     * @param {EventTypes} eventType
     * @param {string} appName
     * @return {string}
     */
    public static getEventDir(eventType: EventTypes, appName: string): string {
        return eventType === EventTypes.CustomSharedEvents || eventType === EventTypes.CustomUserEvents ?
            join(".events", appName) : ".events";
    }

    /**
     * Ensures that the specified directory for storing event files exists.
     * Creates the directory if not.
     *
     * @param {string} directoryPath
     */
    public static ensureEventsDirExists(directoryPath: string) {
        try {
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath);
            }
        } catch (err) {
            throw new ImperativeError({ msg: `Unable to create '.events' directory. Path: ${directoryPath}`, causeErrors: err });
        }
    }

    /**
     * Creates a subscription for an event. It configures and stores an event instance within the EventEmitter's subscription map.
     *
     * @param {EventEmitter} eeInst The instance of EventEmitter to which the event is registered.
     * @param {string} eventName
     * @param {EventTypes} eventType
     * @return {IRegisteredAction} An object that includes a method to unsubscribe from the event.
     */
    public static createSubscription(eeInst: EventEmitter, eventName: string, eventType: EventTypes): IRegisteredAction {
        const dir = this.getEventDir(eventType, eeInst.appName);
        this.ensureEventsDirExists(dir);
        const filePath = join(dirname(ConfigUtils.getZoweDir()), eventName);

        const newEvent = new Event({
            eventTime: new Date().toISOString(),
            eventName: eventName,
            eventType: eventType,
            appName: eeInst.appName,
            filePath: filePath,
            subscriptions: []
        });

        eeInst.events.set(eventName, newEvent);

        return {
            close: () => eeInst.unsubscribe(eventName)
        };
    }

    public static setupWatcher(eeInst: EventEmitter, eventName: string, callbacks: Function[] = []): fs.FSWatcher {
        const event = eeInst.events.get(eventName);
        const watcher = fs.watch(event.filePath, (trigger: "rename" | "change") => {
            // Accommodates for the delay between actual file change event and fsWatcher's perception
            //(Node.JS triggers this notification event 3 times)
            if (eeInst.eventTimes.get(eventName) !== event.eventTime) {
                eeInst.logger.debug(`EventEmitter: Event "${trigger}" emitted: ${eventName}`);
                // Promise.all(callbacks)
                callbacks.forEach(cb => cb());
                eeInst.eventTimes.set(eventName, event.eventTime);
            }
        });
        event.subscriptions.push(watcher);
        return watcher;
    }

    /**
     * Writes the specified event to its corresponding file.
     *
     * @param {Event} event
     */
    public static writeEvent(event: Event) {
        const eventPath = join(ConfigUtils.getZoweDir(), event.filePath);
        this.ensureEventsDirExists(eventPath);
        fs.writeFileSync(eventPath, JSON.stringify(event.toJson(), null, 2));
    }
}