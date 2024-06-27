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
import { IEventDisposable, IEventJson } from "./doc";
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
     * Retrieves a list of supported applications from configuration.
     *
     * @static
     * @returns {string[]} List of application names.
     */
    public static getListOfApps(): string[] {
        const extendersJson = ConfigUtils.readExtendersJson();
        return ["Zowe", ...Object.keys(extendersJson.profileTypes)];
    }

    /**
     * Won't throw an error if user entered a valid appName
     *
     * @static
     * @param {string} appName - The name of the application.
     */
    public static validateAppName(appName: string): void {
        const appList = this.getListOfApps();
        if (appList.includes(appName)) return;
        // Performing `appList.find(app => app.includes(appName))` will allow for "tags" (or suffixes) coming from `getListOfApps()`
        // However, we do not want this behavior because it will allow partial application names to be used
        // Hence why we should probably match the application name with the exact profileType in `extenders.json`
        throw new ImperativeError({
            msg: `Application name not found: ${appName}. Please use an application name from the list:\n- ${appList.join("\n- ")}`
        });
    }

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
     * Retrieve the event contents form disk
     *
     * @internal This is not intended for application developers
     * @param eventFilePath The path to the event file
     * @returns The object representing the Event
     */
    public static getEventContents(eventFilePath: string): IEventJson {
        try {
            return JSON.parse(fs.readFileSync(eventFilePath).toString());
        } catch (err) {
            throw new ImperativeError({ msg: `Unable to retrieve event contents: Path: ${eventFilePath}` });
        }
    }

    /**
     * Determines the directory path for storing event files based on the event type and application name.
     *
     * @param {string} appName - The name of the application.
     * @return {string} The directory path.
     */
    public static getEventDir(appName: string): string {
        this.validateAppName(appName);
        return join(".events", appName);
    }

    /**
     * Ensures that the specified directory for storing event files exists, creating it if necessary.
     *
     * @param {string} directoryPath - The path to the directory.
     */
    public static ensureEventsDirExists(directoryPath: string) {
        try {
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, {mode: 0o750, recursive: true}); // user read/write/exec, group read/exec
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
            const fd = fs.openSync(filePath, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_RDWR, 0o600);
            fs.closeSync(fd);
        } catch (err) {
            throw new ImperativeError({ msg: `Unable to create event file. Path: ${filePath}`, causeErrors: err });
        }
    }

    /**
     * Create an event with minimal information
     *
     * @internal This is not intended for application developers
     * @param eventName The name of the event.
     * @param appName The name of the application.
     * @returns The created event
     */
    public static createEvent(eventName: string, appName: string): Event {
        const zoweDir = ConfigUtils.getZoweDir();
        const dir = join(zoweDir, EventUtils.getEventDir(appName));
        this.ensureEventsDirExists(dir);

        const filePath = join(dir, eventName);
        this.ensureFileExists(filePath);

        return new Event({
            eventTime: new Date().toISOString(),
            eventName: eventName,
            appName: appName,
            eventFilePath: filePath,
            subscriptions: [],
        });
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
        const newEvent = EventUtils.createEvent(eventName, eeInst.appName);
        newEvent.eventType = eventType;
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
            event.eventTime = EventUtils.getEventContents(event.eventFilePath).eventTime;
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