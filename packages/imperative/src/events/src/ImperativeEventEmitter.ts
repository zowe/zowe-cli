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

import { homedir } from "os";
import * as fs from "fs";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { join } from "path";
import { ImperativeError } from "../../error";
import { ImperativeEventType, ImperativeUserEvents, ImperativeSharedEvents } from "./ImperativeEventConstants";
import { ImperativeEvent } from "./ImperativeEvent";
import { Logger } from "../../logger";
import { ProfileInfo } from "../../config";
import { LoggerManager } from "../../logger/src/LoggerManager";
import { IImperativeRegisteredAction } from "./doc/IImperativeRegisteredAction";
import { IImperativeEventEmitterOpts } from "./doc/IImperativeEventEmitterOpts";

export class ImperativeEventEmitter {
    private static mInstance: ImperativeEventEmitter;
    private static initialized = false;
    public appName: string;
    public logger: Logger;
    private subscriptions: Map<string, [fs.FSWatcher, Function[]]>;

    public static initialize(appName?: string, options?: IImperativeEventEmitterOpts) {
        if (this.initialized) {
            throw new ImperativeError({msg: "Only one instance of the Imperative Event Emitter is allowed"});
        }
        this.initialized = true;
        ImperativeEventEmitter.instance.appName = appName;
        ImperativeEventEmitter.instance.logger = options?.logger ?? Logger.getImperativeLogger();
    }
    public static get instance(): ImperativeEventEmitter {
        if (this.mInstance == null) {
            this.mInstance = new ImperativeEventEmitter();
        }
        return this.mInstance;
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
            throw new ImperativeError({ msg: `Unable to create file path: ${filePath}`, causeErrors: err });
        }
    }

    /**
     * Helper method to initialize the event
     * @param eventType The type of event to initialize
     * @returns The initialized ImperativeEvent
     */
    private initializeEvent(eventType: ImperativeEventType | string): ImperativeEvent {
        if (ImperativeConfig.instance.loadedConfig == null || LoggerManager.instance.isLoggerInit === false) {
            ProfileInfo.initImpUtils("zowe");
        }

        return new ImperativeEvent({ appName: this.appName, eventType, logger: this.logger });
    }

    /**
     * Check to see if the given event is a User event
     * @param eventType A string representing the type of event
     * @returns True if it is a user event, false otherwise
     */
    public isUserEvent(eventType: string): eventType is ImperativeEventType {
        return Object.values<string>(ImperativeUserEvents).includes(eventType);
    }

    /**
     * Check to see if the given event is a shared event
     * @param eventType A string representing the type of event
     * @returns True if it is a shared event, false otherwise
     */
    public isSharedEvent(eventType: string): eventType is ImperativeEventType {
        return Object.values<string>(ImperativeSharedEvents).includes(eventType);
    }

    /**
     * Check to see if the given event is a Custom event
     * @param eventType A string representing the type of event
     * @returns True if it is not a zowe or a user event, false otherwise
     * @internal Not implemented in the MVP
     */
    public isCustomEvent(eventType: string): eventType is ImperativeEventType {
        return !this.isUserEvent(eventType) && !this.isSharedEvent(eventType);
    }

    /**
     * Simple method to write the events to disk
     * @param eventType The type of event to write
     * @internal We do not want to make this function accessible to any application developers
     */
    public emitEvent(eventType: ImperativeEventType) {
        const theEvent = this.initializeEvent(eventType);

        let dir: string;
        if (this.isUserEvent(eventType)) {
            dir = this.getUserEventDir();
            theEvent.isUserSpecific = true;
        } else if (this.isSharedEvent(eventType)) {
            dir = this.getSharedEventDir();
        } else {
            throw new ImperativeError({ msg: `Unable to determine the type of event. Event: ${eventType}` });
        }

        this.writeEvent(dir, theEvent);
    }

    /**
     * Simple method to write the events to disk
     * @param eventType The type of event to write
     * @internal Not implemented in the MVP
     */
    public emitCustomEvent(eventType: ImperativeEventType) { //, isUserSpecific: boolean = false) {
        const theEvent = this.initializeEvent(eventType);

        let dir: string;
        if (this.isCustomEvent(eventType)) {
            // TODO: Allow for user specific custom events (this applies everywhere we call `isCustomEvent`)
            dir = this.getSharedEventDir();
        } else {
            throw new ImperativeError({ msg: `Operation not allowed. Event is considered protected. Event: ${eventType}` });
        }

        this.writeEvent(dir, theEvent);
    }

    /**
     * Helper method to write contents out to disk
     * @param location directory to write the file (i.e. emit the event)
     * @param event the event to be written/emitted
     * @internal We do not want developers writing events directly, they should use the `emit...` methods
     */
    private writeEvent(location: string, event: ImperativeEvent) {
        const eventPath = join(location, event.eventType);
        const eventJson = { ...event.toJson(), loc: location };

        this.ensureEventsDirExists(location);
        fs.writeFileSync(eventPath, JSON.stringify(eventJson, null, 2));
    }

    /**
     * Method to register your custom actions based on when the given event is emitted
     * @param eventType Type of event to register
     * @param callback Action to be registered to the given event
     */
    public subscribe(eventType: string, callback: Function): IImperativeRegisteredAction {
        if (ImperativeConfig.instance.loadedConfig == null || LoggerManager.instance.isLoggerInit === false) {
            ProfileInfo.initImpUtils("zowe");
        }
        if (this.subscriptions == null) {
            this.subscriptions = new Map();
        }

        let dir: string;
        if (this.isUserEvent(eventType)) {
            dir = this.getUserEventDir();
        } else if (this.isSharedEvent(eventType)) {
            dir = this.getSharedEventDir();
        } else if (this.isCustomEvent(eventType)) {
            dir = this.getSharedEventDir();
        }

        if (dir == null) {
            throw new ImperativeError({msg: "Unable to identify the type of event"});
        }

        this.ensureEventsDirExists(dir); //ensure .events exist

        const setupWatcher = (callbacks: Function[] = []): fs.FSWatcher => {
            this.ensureEventFileExists(join(dir, eventType));
            const watcher = fs.watch(join(dir, eventType), (event: "rename" | "change", filename: string) => {
                this.logger.debug(`ImperativeEventEmitter: Event "${event}" emitted: ${eventType}`);
                callbacks.forEach(cb => cb());
                callback();
            });
            this.subscriptions.set(eventType, [watcher, [...callbacks, callback]]);
            return watcher;
        };

        let watcher: fs.FSWatcher;
        if (this.subscriptions.get(eventType) != null) {
            // throw new ImperativeError({msg: "Only one subscription per event is allowed"});
            const [watcherToClose, callbacks] = this.subscriptions.get(eventType);
            watcherToClose.removeAllListeners(eventType).close();

            watcher = setupWatcher(callbacks);
        } else {
            watcher = setupWatcher();
        }
        return { close: watcher.close };
    }

    /**
     * Method to unsubscribe from custom and regular events
     * @param eventType Type of registered event
     */
    public unsubscribe(eventType: string): void {
        const [watcherToClose, _callbacks] = this.subscriptions.get(eventType);
        watcherToClose.removeAllListeners(eventType).close();
        this.subscriptions.delete(eventType);
    }
}