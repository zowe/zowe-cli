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
import { homedir } from "os";
import { join } from "path";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { ImperativeError } from "../../error/src/ImperativeError";
import { ImperativeEventType, ImperativeUserEvents, ImperativeSharedEvents } from "./ImperativeEventConstants";
import { ImperativeEvent } from "./ImperativeEvent";
import { Logger } from "../../logger/src/Logger";
import { LoggerManager } from "../../logger/src/LoggerManager";
import { IImperativeRegisteredAction, IImperativeEventEmitterOpts, IImperativeEventJson } from "./doc";
import { ConfigUtils } from "../../config/src/ConfigUtils";

export class ImperativeEventEmitter {
    private static mInstance: ImperativeEventEmitter;
    private static initialized = false;
    private subscriptions: Map<string, [fs.FSWatcher, Function[]]>;
    private eventTimes: Map<string, string>;
    public appName: string;
    public logger: Logger;

    public static initialize(appName?: string, options?: IImperativeEventEmitterOpts) {
        if (this.initialized) {
            throw new ImperativeError({msg: "Only one instance of the Imperative Event Emitter is allowed"});
        }
        this.initialized = true;

        if (ImperativeConfig.instance.loadedConfig == null || LoggerManager.instance.isLoggerInit === false) {
            ConfigUtils.initImpUtils("zowe");
        }

        ImperativeEventEmitter.instance.appName = appName;
        ImperativeEventEmitter.instance.logger = options?.logger ?? Logger.getImperativeLogger();
    }
    public static get instance(): ImperativeEventEmitter {
        if (this.mInstance == null) {
            this.mInstance = new ImperativeEventEmitter();
            this.mInstance.subscriptions = new Map();
            this.mInstance.eventTimes = new Map();
        }
        return this.mInstance;
    }

    /**
     * Check to see if the Imperative Event Emitter instance has been initialized
     */
    private ensureClassInitialized() {
        if (!ImperativeEventEmitter.initialized) {
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
     * @param eventName The type of event to initialize
     * @returns The initialized ImperativeEvent
     */
    private initEvent(eventName: ImperativeEventType | string): ImperativeEvent {
        this.ensureClassInitialized();
        return new ImperativeEvent({ appName: this.appName, eventName, isUser: this.isUserEvent(eventName), logger: this.logger });
    }

    /**
     * Helper method to write contents out to disk
     * @param location directory to write the file (i.e. emit the event)
     * @param event the event to be written/emitted
     * @internal We do not want developers writing events directly, they should use the `emit...` methods
     */
    private writeEvent(location: string, event: ImperativeEvent) {
        event.location = location;

        this.ensureEventsDirExists(location);
        fs.writeFileSync(join(location, event.type), JSON.stringify(event.toJson(), null, 2));
    }

    /**
     * Helper method to create watchers based on event strings and list of callbacks
     * @param eventName type of event to which we will create a watcher for
     * @param callbacks list of all callbacks for this watcher
     * @returns The FSWatcher instance created
     */
    private setupWatcher(eventName: string, callbacks: Function[] = []): fs.FSWatcher {
        const dir = this.getEventDir(eventName);
        this.ensureEventsDirExists(dir); //ensure .events exist

        this.ensureEventFileExists(join(dir, eventName));
        const watcher = fs.watch(join(dir, eventName), (event: "rename" | "change") => {
            // Node.JS triggers this event 3 times
            const eventContents = this.getEventContents(eventName);
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
     * Check to see if the given event is a User event
     * @param eventName A string representing the type of event
     * @returns True if it is a user event, false otherwise
     */
    public isUserEvent(eventName: string): eventName is ImperativeEventType {
        return Object.values<string>(ImperativeUserEvents).includes(eventName);
    }

    /**
     * Check to see if the given event is a shared event
     * @param eventName A string representing the type of event
     * @returns True if it is a shared event, false otherwise
     */
    public isSharedEvent(eventName: string): eventName is ImperativeEventType {
        return Object.values<string>(ImperativeSharedEvents).includes(eventName);
    }

    /**
     * Check to see if the given event is a Custom event
     * @param eventName A string representing the type of event
     * @returns True if it is not a zowe or a user event, false otherwise
     * @internal Not implemented in the MVP
     */
    public isCustomEvent(eventName: string): eventName is ImperativeEventType {
        return !this.isUserEvent(eventName) && !this.isSharedEvent(eventName);
    }

    /**
     * ZOWE HOME directory to search for system wide ImperativeEvents like `configChanged`
     */
    public getSharedEventDir(): string {
        return join(ImperativeConfig.instance.cliHome, ".events");
    }

    /**
     * USER HOME directory to search for user specific ImperativeEvents like `vaultChanged`
     */
    public getUserEventDir(): string {
        return join(homedir(), ".zowe", ".events");
    }

    /**
     * Obtain the directory of the event
     * @param eventName The type of event to be emitted
     * @returns The directory to where this event will be emitted
     */
    public getEventDir(eventName: string): string {
        if (this.isUserEvent(eventName)) {
            return this.getUserEventDir();
        } else if (this.isSharedEvent(eventName)) {
            return this.getSharedEventDir();
        }

        return this.getSharedEventDir();
    }

    /**
     * Obtain the contents of the event
     * @param eventName The type of event to retrieve contents from
     * @returns The contents of the event
     * @internal
     */
    public getEventContents(eventName: string): string {
        return fs.readFileSync(join(this.getEventDir(eventName), eventName)).toString();
    }

    /**
     * Simple method to write the events to disk
     * @param eventName The type of event to write
     * @internal We do not want to make this function accessible to any application developers
     */
    public emitEvent(eventName: ImperativeEventType) {
        const theEvent = this.initEvent(eventName);

        if (this.isCustomEvent(eventName)) {
            throw new ImperativeError({ msg: `Unable to determine the type of event. Event: ${eventName}` });
        }

        this.writeEvent(this.getEventDir(eventName), theEvent);
    }

    /**
     * Simple method to write the events to disk
     * @param eventName The type of event to write
     * @internal We won't support custom events as part of the MVP
     */
    public emitCustomEvent(eventName: string) { //, isUserSpecific: boolean = false) {
        const theEvent = this.initEvent(eventName);

        if (!this.isCustomEvent(eventName)) {
            throw new ImperativeError({ msg: `Operation not allowed. Event is considered protected. Event: ${eventName}` });
        }

        this.writeEvent(this.getSharedEventDir(), theEvent);
    }

    /**
     * Method to register your custom actions based on when the given event is emitted
     * @param eventName Type of event to register
     * @param callback Action to be registered to the given event
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
     * Method to unsubscribe from custom and regular events
     * @param eventName Type of registered event
     */
    public unsubscribe(eventName: string): void {
        this.ensureClassInitialized();

        if (this.subscriptions.has(eventName)) {
            const [watcherToClose, _callbacks] = this.subscriptions.get(eventName);
            watcherToClose.removeAllListeners(eventName).close();
            this.subscriptions.delete(eventName);
        }
        if (this.eventTimes.has(eventName)) {
            this.eventTimes.delete(eventName);
        }
    }
}