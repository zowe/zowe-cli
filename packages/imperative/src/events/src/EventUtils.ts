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
import { join } from "path";
import { ZoweUserEvents, ZoweSharedEvents, EventTypes, EventCallback } from "./EventConstants";
import * as fs from "fs";
import { ConfigUtils } from "../../config/src/ConfigUtils";
import { IEventDisposable } from "./doc";
import { Event } from "./Event";
import { EventProcessor } from "./EventProcessor";

/**
 * A collection of helper functions related to event processing, including:
 * - directory management
 * - event type determination
 * - subscription creation and setting callbacks
 * - event writing
 */
export class EventUtils {

    /**
     * Determines if the specified event name is associated with a user event.
     *
     * @param {string} eventName - The name of the event.
     * @return {boolean} True if it is a user event, otherwise false.
     */
    public static isUserEvent(eventName: string): boolean {
        return Object.values<string>(ZoweUserEvents).includes(eventName);
    }

    /**
     * Determines if the specified event name is associated with a shared event.
     *
     * @param {string} eventName - The name of the event.
     * @return {boolean} True if it is a shared event, otherwise false.
     */
    public static isSharedEvent(eventName: string): boolean {
        return Object.values<string>(ZoweSharedEvents).includes(eventName);
    }

    /**
     * Determines the directory path for storing event files based on the event type and application name.
     *
     * @param {EventTypes} eventType - The type of event.
     * @param {string} appName - The name of the application.
     * @return {string} The directory path.
     */
    public static getEventDir(eventType: EventTypes, appName: string): string {
        return eventType === EventTypes.SharedEvents || eventType === EventTypes.UserEvents ?
            join(".events", appName) : ".events";
    }

    /**
     * Ensures that the specified directory for storing event files exists, creating it if necessary.
     *
     * @param {string} directoryPath - The path to the directory.
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
     * Ensures that the specified file path for storing event data exists, creating it if necessary.
     *
     * @param {string} filePath - The path to the file.
     */
    public static ensureFileExists(filePath: string) {
        try {
            if (!fs.existsSync(filePath)) {
                fs.closeSync(fs.openSync(filePath, 'w'));
            }
        } catch (err) {
            throw new ImperativeError({ msg: `Unable to create event file. Path: ${filePath}`, causeErrors: err });
        }
    }

    /**
     * Creates and registers a new event subscription for a specific event processor.
     *
     * @param {EventProcessor} eeInst - The event processor instance.
     * @param {string} eventName - The name of the event.
     * @param {EventTypes} eventType - The type of event.
     * @return {IEventDisposable} An interface for managing the subscription.
     */
    public static createSubscription(eeInst: EventProcessor, eventName: string, eventType: EventTypes): IEventDisposable {
        const dir = this.getEventDir(eventType, eeInst.appName);
        this.ensureEventsDirExists(join(ConfigUtils.getZoweDir(), '.events'));
        this.ensureEventsDirExists(join(ConfigUtils.getZoweDir(), dir));

        const filePath = join(ConfigUtils.getZoweDir(), dir, eventName);
        this.ensureFileExists(filePath);

        const newEvent = new Event({
            eventTime: new Date().toISOString(),
            eventName: eventName,
            eventType: eventType,
            appName: eeInst.appName,
            eventFilePath: filePath,
            subscriptions: []
        });

        eeInst.subscribedEvents.set(eventName, newEvent);

        return {
            close: () => eeInst.unsubscribe(eventName)
        };
    }

    /**
     * Sets up a file watcher for a specific event, triggering callbacks when the event file is updated.
     *
     * @param {EventProcessor} eeInst - The event processor instance.
     * @param {string} eventName - The name of the event.
     * @param {EventCallback[] | EventCallback} callbacks - A single callback or an array of callbacks to execute.
     * @return {fs.FSWatcher} A file system watcher.
     */
    public static setupWatcher(eeInst: EventProcessor, eventName: string, callbacks: EventCallback[] | EventCallback): fs.FSWatcher {
        const event = eeInst.subscribedEvents.get(eventName);
        const watcher = fs.watch(event.eventFilePath, (trigger: "rename" | "change") => {
            // Accommodates for the delay between actual file change event and fsWatcher's perception
            //(Node.JS triggers this notification event 3 times)
            if (eeInst.eventTimes.get(eventName) !== event.eventTime) {
                eeInst.logger.debug(`EventEmitter: Event "${trigger}" emitted: ${eventName}`);
                if (Array.isArray(callbacks)) {
                    callbacks.forEach(cb => cb());
                } else {
                    callbacks();
                }
                eeInst.eventTimes.set(eventName, event.eventTime);
            }
        });
        event.subscriptions.push(watcher);
        return watcher;
    }

    /**
     * Writes event data to the corresponding event file in JSON format.
     *
     * @param {Event} event - The event object.
     */
    public static writeEvent(event: Event) {
        fs.writeFileSync(event.eventFilePath, JSON.stringify(event.toJson(), null, 2));
    }
}