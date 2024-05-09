/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*/

import { EventEmitter } from "./EventEmitter";
import { ImperativeError } from "../../error/src/ImperativeError";
import { dirname, join } from "path";
import { UserEvents, SharedEvents, EventTypes } from "./EventConstants";
import * as fs from "fs";
import { ProfileInfo } from "../../config";
import { IRegisteredAction } from "./doc";
import { Event } from "./Event";

/**
 * The EventEmitterManager class serves as a central hub for managing
 * event emitters and their watched events.
 *
 * @export
 * @class EventEmitterManager
 */
export class EventEmitterManager {
    private static instances: Map<string, EventEmitter> = new Map();

    /**
     * Retrieves an existing EventEmitter instance or creates a new one if it does not exist.
     * Ensures that each application has a unique EventEmitter instance.
     *
     * @static
     * @param {string} appName key to KVP for managed event emitter instances
     * @return {(EventEmitter | undefined)} Returns the EventEmitter instance or undefined if it cannot be created.
     */
    public static getEmitter(appName: string): EventEmitter | undefined {
        if (!this.instances.has(appName)) {
            const newInstance = new EventEmitter(appName, this.logger);
            this.instances.set(appName, newInstance);
        }
        return this.instances.get(appName);
    }

    /**
     * A collection of helper functions related to event management, including:
     * - directory management
     * - event type determination
     * - subscription creation
     * - watcher creation and setting callbacks
     * - event writing
     */
    public static Helpers = {
        /**
         * Determines if the specified event name is a user event.
         *
         * @param {string} eventName
         * @return {boolean}
         */
        isUserEvent: function(eventName: string): boolean {
            return Object.values<string>(UserEvents).includes(eventName);
        },

        /**
         * Determines if the specified event name is a shared event.
         *
         * @param {string} eventName
         * @return {boolean}
         */
        isSharedEvent: function(eventName: string): boolean {
            return Object.values<string>(SharedEvents).includes(eventName);
        },

        /**
         * Retrieves the directory path for events based on the event type and application name.
         *
         * @param {EventTypes} eventType
         * @param {string} appName
         * @return {string}
         */
        getEventDir: function(eventType: EventTypes, appName: string): string {
            return eventType === EventTypes.CustomSharedEvents || eventType === EventTypes.CustomUserEvents ?
                join(".events", appName) : ".events";
        },

        /**
         * Ensures that the specified directory for storing event files exists.
         * Creates the directory if not.
         *
         * @param {string} directoryPath
         */
        ensureEventsDirExists: function(directoryPath: string) {
            try {
                if (!fs.existsSync(directoryPath)) {
                    fs.mkdirSync(directoryPath);
                }
            } catch (err) {
                throw new ImperativeError({ msg: `Unable to create '.events' directory. Path: ${directoryPath}`, causeErrors: err });
            }
        },

        /**
         * Creates a subscription for an event. It configures and stores an event instance within the EventEmitter's subscription map.
         *
         * @param {EventEmitter} eeInst The instance of EventEmitter to which the event is registered.
         * @param {string} eventName
         * @param {EventTypes} eventType
         * @return {IRegisteredAction} An object that includes a method to unsubscribe from the event.
         */
        createSubscription: function(eeInst: EventEmitter, eventName: string, eventType: EventTypes): IRegisteredAction {
            const dir = this.getEventDir(eventType, eeInst.appName);
            this.ensureEventsDirExists(dir);
            const filePath = join(dirname(ProfileInfo.getZoweDir()), eventName);

            const newEvent = new Event({
                eventTime: new Date().toISOString(),
                eventName: eventName,
                eventType: eventType,
                appName: eeInst.appName,
                filePath: filePath,
                watchers: []
            });

            eeInst.events.set(eventName, newEvent);

            return {
                close: () => eeInst.unsubscribe(eventName)
            };
        },

        setupWatcher: function(eeInst: EventEmitter, eventName: string, callbacks: Function[] = []): fs.FSWatcher {
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
            event.watchers.push(watcher);
            return watcher;
        },

        /**
         * Writes the specified event to its corresponding file.
         *
         * @param {Event} event
         */
        writeEvent: function(event: Event) {
            const eventPath = join(ProfileInfo.getZoweDir(), event.filePath);
            this.ensureEventsDirExists(eventPath);
            fs.writeFileSync(eventPath, JSON.stringify(event.toJson(), null, 2));
        }
    };
}