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
import { ImperativeEventType, ImperativeUserEvents, ImperativeZoweEvents as ImperativeSharedEvents } from "./ImperativeEventConstants";
import { ImperativeEvent } from "./ImperativeEvent";
import { Logger } from "../../logger";
import { ProfileInfo } from "../../config";
import { LoggerManager } from "../../logger/src/LoggerManager";
import { IImperativeRegisteredAction } from "./doc/IImperativeRegisteredAction";

export class ImperativeEventEmitter {
    /**
     * ZOWE HOME directory to search for system wide ImperativeEvents like `configChanged`
     */
    public static getSharedEventDir(): string {
        return join(ImperativeConfig.instance.cliHome, ".events");
    }

    /**
     * USER HOME directory to search for user specific ImperativeEvents like `vaultChanged`
     */
    public static getUserEventDir(): string {
        return join(homedir(), ".zowe", ".events");
    }

    /**
     * Check to see if the directory exists, otherwise, create it : )
     * @param directoryPath Zowe or User path where we will write the events
     */
    private static ensureEventsDirExists(directoryPath: string) {
        try {
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath);
            }
        } catch (err) {
            throw new ImperativeError({ msg: `Unable to create '.events' directory. Path: ${directoryPath}`, causeErrors: err });
        }
    }

    /**
     * Helper method to initialize the event
     * @param eventType The type of event to initialize
     * @returns The initialized ImperativeEvent
     */
    private static initializeEvent(eventType: string): ImperativeEvent {
        if (ImperativeConfig.instance.loadedConfig == null || LoggerManager.instance.isLoggerInit === false) {
            ProfileInfo.initImpUtils("zowe");
        }

        let appName = ImperativeConfig.instance.loadedConfig?.name;
        const logger = Logger.getImperativeLogger();

        try {
            appName = ImperativeConfig.instance.callerPackageJson.name;
        } catch (e) {
            logger.error(`Unable to get the source from the callerPackageJson. \n${e}`);
        }

        if (appName == null) {
            throw new ImperativeError({
                msg: `Unable to initialize the Imperative utilities to emit this event. Event: ${eventType} \t| App: ${appName}`
            });
        }
        return new ImperativeEvent({ appName, eventType, logger });
    }

    /**
     * Check to see if the given event is a User event
     * @param eventType A string representing the type of event
     * @returns True if it is a user event, false otherwise
     */
    public static isUserEvent(eventType: string): boolean {
        return !!ImperativeUserEvents.find((e) => e === eventType);
    }

    /**
     * Check to see if the given event is a shared event
     * @param eventType A string representing the type of event
     * @returns True if it is a shared event, false otherwise
     */
    public static isSharedEvent(eventType: string): boolean {
        return !!ImperativeSharedEvents.find((e) => e === eventType);
    }

    /**
     * Check to see if the given event is a Custom event
     * @param eventType A string representing the type of event
     * @returns True if it is not a zowe or a user event, false otherwise
     */
    public static isCustomEvent(eventType: string): boolean {
        return !ImperativeEventEmitter.isUserEvent(eventType) && !ImperativeEventEmitter.isSharedEvent(eventType);
    }

    /**
     * Simple method to write the events to disk
     * @param eventType The type of event to write
     * @internal We do not want to make this function accessible to any application developers
     */
    public static emitEvent(eventType: ImperativeEventType) {
        const theEvent = ImperativeEventEmitter.initializeEvent(eventType);

        let dir: string;
        if (ImperativeEventEmitter.isUserEvent(eventType)) {
            dir = ImperativeEventEmitter.getUserEventDir();
            theEvent.isUserSpecific = true;
        } else if (ImperativeEventEmitter.isSharedEvent(eventType)) {
            dir = ImperativeEventEmitter.getSharedEventDir();
        } else {
            throw new ImperativeError({ msg: `Unable to determine the type of event. Event: ${eventType}` });
        }

        ImperativeEventEmitter.writeEvent(dir, theEvent);
    }

    /**
     * Simple method to write the events to disk
     * @param eventType The type of event to write
     */
    public static emitCustomEvent(eventType: string) { //, isUserSpecific: boolean = false) {
        const theEvent = ImperativeEventEmitter.initializeEvent(eventType);

        let dir: string;
        if (ImperativeEventEmitter.isCustomEvent(eventType)) {
            // TODO: Allow for user specific custom events (this applies everywhere we call `isCustomEvent`)
            dir = ImperativeEventEmitter.getSharedEventDir();
        } else {
            throw new ImperativeError({ msg: `Operation not allowed. Event is considered protected. Event: ${eventType}` });
        }

        ImperativeEventEmitter.writeEvent(dir, theEvent);
    }

    /**
     * Helper method to write contents out to disk
     * @param location directory to write the file (i.e. emit the event)
     * @param event the event to be written/emitted
     * @internal
     */
    private static writeEvent(location: string, event: ImperativeEvent) {
        const eventPath = join(location, event.eventType);
        const eventJson = { ...event.toJson(), loc: location };

        ImperativeEventEmitter.ensureEventsDirExists(location);
        fs.writeFileSync(eventPath, JSON.stringify(eventJson, null, 2));
    }

    /**
     * Method to register your custom actions based on when the given event is emitted
     * @param eventType Type of event to register
     * @param callback Action to be registered to the given event
     */
    public static registerAction(eventType: string, callback: (...args: any[]) => any): IImperativeRegisteredAction {
        if (ImperativeConfig.instance.loadedConfig == null || LoggerManager.instance.isLoggerInit === false) {
            ProfileInfo.initImpUtils("zowe");
        }
        // TODO: Make sure that there is  only one watcher per (application:event) combination
        /*
            private static mInstance: ImperativeEventEmitter;
            private mAppName: string;
            private logger: Logger;
            public static initialize(applicationName: string, logger?: Logger) {
                mAppName = applicationName;
                logger = logger ?? Logger.getImperativeLogger();
            }
            public static get instance(): ImperativeEventEmitter {
                if (this.mInstance == null) {
                    this.mInstance = new ImperativeEventEmitter();
                }

                return this.mInstance;
            }

            // (new imperative.ImperativeEventEmitter("onVaultChanged")).instance.registerAction(() => {})
            // The instance should prevent multiple actions from being registered
        */

        return ImperativeEventEmitter.nodejsImplementation(eventType, callback);
        //return ImperativeEventEmitter.chokidarImplementation(eventType, callback);
    }

    private static nodejsImplementation(eventType: string, callback: (...args: any[]) => any): IImperativeRegisteredAction {
        const logger = Logger.getImperativeLogger();
        let dir: string;
        if (ImperativeEventEmitter.isUserEvent(eventType)) {
            dir = ImperativeEventEmitter.getUserEventDir();
        } else if (ImperativeEventEmitter.isSharedEvent(eventType)) {
            dir = ImperativeEventEmitter.getSharedEventDir();
        } else if (ImperativeEventEmitter.isCustomEvent(eventType)) {
            dir = ImperativeEventEmitter.getSharedEventDir();
        }

        const watcher = fs.watch(join(dir, eventType), (event: "rename" | "change", filename: string) => {
            console.log("ImperativeEventEmitter: ", event, filename);
            logger.debug(`ImperativeEventEmitter: Event "${event}" emitted: ${eventType}`);
            callback();
        });

        return { close: watcher.close };
    }

    /**
     * Implementation with the chokidar package
     * @note This has not be tested yet
     * @note You may have to install the package locally in order to try this out
     */
    private static chokidarImplementation(eventType: ImperativeEventType, callback: (...args: any[]) => any): IImperativeRegisteredAction {
        const chokidar = require("chokidar");
        const logger = Logger.getImperativeLogger();
        let dir: string;
        if (ImperativeEventEmitter.isUserEvent(eventType)) {
            dir = ImperativeEventEmitter.getUserEventDir();
        } else if (ImperativeEventEmitter.isSharedEvent(eventType)) {
            dir = ImperativeEventEmitter.getSharedEventDir();
        } else if (ImperativeEventEmitter.isCustomEvent(eventType)) {
            dir = ImperativeEventEmitter.getSharedEventDir();
        }

        const watcher = chokidar.watch(join(dir, eventType));
        watcher.on("change", (filePath: string) => {
            console.log("ImperativeEventEmitter: ", "change", filePath);
            logger.debug(`ImperativeEventEmitter: Event "change" emitted: ${eventType}`);
            callback();
        });
        return {
            close: () => {
                watcher.unwatch(join(dir, eventType));
            }
        };
    }
}
