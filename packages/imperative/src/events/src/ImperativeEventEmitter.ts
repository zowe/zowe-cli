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

import * as fs from "fs";
import { join } from "path";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { ImperativeError } from "../../error/src/ImperativeError";
import {
    ImperativeEventTypes,
    ImperativeUserEvents,
    ImperativeSharedEvents,
    ImperativeCustomShared,
    ImperativeCustomUser
} from "./ImperativeEventConstants";
import { ImperativeEvent } from "./ImperativeEvent";
import { Logger } from "../../logger/src/Logger";
import { IImperativeRegisteredAction, IImperativeEventEmitterOpts, IImperativeEventJson } from "./doc";

export class ImperativeEventEmitter {
    private static mInstance: ImperativeEventEmitter;
    private initialized = false;
    private subscriptions: Map<string, [fs.FSWatcher, Function[]]> = new Map();
    private eventTimes: Map<string, string>;
    public appName: string;
    public logger: Logger;
    public eventType: ImperativeEventTypes;
    public loc: string;
    public isCustomShared: boolean;

    public static get instance(): ImperativeEventEmitter {
        if (this.mInstance == null) {
            this.mInstance = new ImperativeEventEmitter();
        }
        return this.mInstance;
    }

    public initialize(appName?: string, options?: IImperativeEventEmitterOpts) {
        if (this.initialized) {
            throw new ImperativeError({msg: "Only one instance of the Imperative Event Emitter is allowed"});
        }
        this.initialized = true;
        ImperativeEventEmitter.instance.appName = appName;
        ImperativeEventEmitter.instance.logger = options?.logger ?? Logger.getImperativeLogger();
    }

    /**
     * Check to see if the Imperative Event Emitter instance has been initialized
     */
    private ensureClassInitialized() {
        if (!this.initialized) {
            throw new ImperativeError({msg: "You must initialize the instance before using any of its methods."});
        }
    }

    /**
     * Check to see if the directory exists, otherwise, create it : )
     * @param directoryPath Zowe or User dir where we will write the events
     */
    private ensureEventsDirExists(directoryPath: string) {
        try {
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath);
            }
        } catch (err) {
            throw new ImperativeError({ msg: `Unable to create '.events' directory. Path: ${directoryPath}`, causeErrors: err });
        }
    }

    /**
     * Check to see if the file path exists, otherwise, create it : )
     * @param filePath Zowe or User path where we will write the events
     */
    private ensureEventFileExists(filePath: string) {
        try {
            if (!fs.existsSync(filePath)) {
                fs.closeSync(fs.openSync(filePath, 'w'));
            }
        } catch (err) {
            throw new ImperativeError({ msg: `Unable to create event file. Path: ${filePath}`, causeErrors: err });
        }
    }

    /**
     * Helper method to initialize the event
     * @param eventName The name of event to initialize
     * @returns The initialized ImperativeEvent
     */
    private initEvent(eventName: string): ImperativeEvent {
        this.ensureClassInitialized();
        return new ImperativeEvent({
            appName: this.appName,
            eventType: this.getEventType(eventName, this.isCustomShared),
            loc: this.getEventDir(eventName, this.eventType, this.appName),
            isCustomShared: this.isCustomShared,
            logger: this.logger
        });
    }

    /**
     * Helper method to write contents out to disk
     * @param location directory to write the file (i.e. emit the event)
     * @param event the event to be written/emitted
     * @internal We do not want developers writing events directly, they should use the `emit...` methods
     */
    private writeEvent(location: string, event: ImperativeEvent) {
        const eventPath = join(location, (event.eventType).toString());
        const eventJson = { ...event.toJson(), loc: location };

        this.ensureEventsDirExists(location);
        fs.writeFileSync(eventPath, JSON.stringify(eventJson, null, 2));
    }

    /**
     * Helper method to create watchers based on event strings and list of callbacks
     * @param eventName name of event to which we will create a watcher for
     * @param callbacks list of all callbacks for this watcher
     * @returns The FSWatcher instance created
     */
    private setupWatcher(eventName: string, callbacks: Function[] = []): fs.FSWatcher {
        const dir = this.getEventDir(eventName, this.eventType, this.appName);
        this.loc = dir;
        this.ensureEventsDirExists(dir); //ensure .events exist

        this.ensureEventFileExists(join(dir, eventName));
        const watcher = fs.watch(join(dir, eventName), (event: "rename" | "change") => {
            // Node.JS triggers this event 3 times
            const eventContents = fs.readFileSync(dir).toString();
            const eventTime = eventContents.length === 0 ? "" : (JSON.parse(eventContents) as IImperativeEventJson).time;

            if (this.eventTimes.get(eventName) !== eventTime) {
                this.logger.debug(`ImperativeEventEmitter: Event "${event}" emitted: ${eventName}`);
                // Promise.all(callbacks)
                callbacks.forEach(cb => cb());
                this.eventTimes.set(eventName, eventTime);
            }
        });
        this.subscriptions.set(eventName, [watcher, callbacks]);
        return watcher;
    }

    /**
     * Returns the eventType based on eventName
     * @param eventName Name of event, ie: onSchemaChanged
     * @param isCustomShared One of the ImperativeEventTypes from ImperativeEventConstants
     */
    private getEventType(eventName: string, isCustomShared: boolean): ImperativeEventTypes {
        if (isCustomShared)
            return ImperativeCustomShared;
        if ( Object.values<string>(ImperativeUserEvents).includes(eventName)){
            return ImperativeUserEvents;
        }
        if (Object.values<string>(ImperativeSharedEvents).includes(eventName)){
            return ImperativeSharedEvents;
        }
        return ImperativeCustomUser;
    }

    /**
     * Returns the directory path based on EventType
     * @param eventName Name of event, ie: onSchemaChanged
     * @param eventType One of the ImperativeEventTypes from ImperativeEventConstants
     * @param appName Needed for custom event path
     */
    public getEventDir(eventName: string, eventType: ImperativeEventTypes, appName: string): string {
        switch (eventType) {
            case ImperativeSharedEvents:
                return join(ImperativeConfig.instance.cliHome, ".zowe", ".events", eventName);
            case ImperativeCustomShared:
                return join(ImperativeConfig.instance.cliHome, ".zowe", ".events", appName, eventName);
            case ImperativeCustomUser:
                return join(ImperativeConfig.instance.cliHome, ".events", appName, eventName);
            default:
                //ImperativeUserEvents
                return join(ImperativeConfig.instance.cliHome, ".events", eventName);
        }
    }

    /**
     * Simple method to write the events to disk
     * @param eventName The name of event to write
     * @internal We do not want to make this function accessible to any application developers
     */
    public emitEvent(eventName: string) {
        const theEvent = this.initEvent(eventName);
        this.writeEvent(this.loc, theEvent);
    }

    /**
     * Method to register your custom actions based on when the given event is emitted
     * @param eventName name of event to register custom action to
     * @param callback Custom action to be registered to the given event
     */
    public subscribe(eventName: string, callback: Function): IImperativeRegisteredAction {
        this.ensureClassInitialized();

        let watcher: fs.FSWatcher;
        if (this.subscriptions.get(eventName) != null) {
            const [watcherToClose, callbacks] = this.subscriptions.get(eventName);
            watcherToClose.removeAllListeners(eventName).close();

            watcher = this.setupWatcher(eventName, [...callbacks, callback]);
        } else {
            watcher = this.setupWatcher(eventName, [callback]);
        }
        return { close: watcher.close };
    }

    /**
     * Method to unsubscribe from any given event
     * @param eventType Type of registered event
     */
    public unsubscribe(eventType: string): void {
        this.ensureClassInitialized();

        if (this.subscriptions.has(eventType)) {
            const [watcherToClose, _callbacks] = this.subscriptions.get(eventType);
            watcherToClose.removeAllListeners(eventType).close();
            this.subscriptions.delete(eventType);
        }
        if (this.eventTimes.has(eventType)) {
            this.eventTimes.delete(eventType);
        }
    }
}