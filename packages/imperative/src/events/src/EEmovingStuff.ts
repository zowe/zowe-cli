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
import { join, dirname } from "path";
import { Logger } from "../../logger/src/Logger";
import { IEventJson, IRegisteredAction } from "./doc";
import { Event } from "./Event";
import { UserEvents, SharedEvents, EventTypes } from "./EventConstants";
import { ProfileInfo } from "../../config/src/ProfileInfo";
import * as fs from "fs";
import { eventNames } from "process";

/**
 * The EventEmitter class manages event emissions and subscriptions for different applications.
 * It utilizes a scoped singleton pattern where instances are mapped by application names.
 * Each instance maintains its own set of event subscriptions, allowing for efficient management
 * of event-related data.
*/
export class EventEmitter {
    private static instances: Map<string, EventEmitter> = new Map();
    private subscriptions: Map<string, IEventJson> = new Map();
    public appName: string;
    public logger: Logger;

    private constructor(appName: string, logger: Logger) {
        this.subscriptions = new Map();
        this.appName = appName;
        this.logger = logger;
    }

    public static Helpers = {
        getInstance: function(appName: string, logger?: Logger): EventEmitter {
            if (!EventEmitter.instances.has(appName)) {
                const effectiveLogger = logger ?? Logger.getImperativeLogger();
                const newInstance = new EventEmitter(appName, effectiveLogger);
                this.instances.set(appName, newInstance);
            }
            return this.instances.get(appName);
        },
        getEventDetails: function(eventName: string): IEventJson | undefined {
            return this.subscriptions.get(eventName);
        },
        ensureEventsDirExists: function(directoryPath: string) {
            try {
                if (!fs.existsSync(directoryPath)) {
                    fs.mkdirSync(directoryPath);
                }
            } catch (err) {
                throw new ImperativeError({ msg: `Unable to create '.events' directory. Path: ${directoryPath}`, causeErrors: err });
            }
        },
        isUserEvent: function(eventName: string): boolean {
            return Object.values<string>(UserEvents).includes(eventName);
        },
        isSharedEvent: function(eventName: string): boolean {
            return Object.values<string>(SharedEvents).includes(eventName);
        },
        getEventDir: function(eventType: EventTypes, appName: string): string {
            if (eventType == EventTypes.CustomSharedEvents || EventTypes.CustomUserEvents){
                return join(".events", appName);
            }
            return ".events";
        },
        createSubscription: function(eeInst: EventEmitter, eventName: string, eventType: EventTypes): IRegisteredAction{
            const dir = EventEmitter.Helpers.getEventDir(eventType, eeInst.appName);
            EventEmitter.Helpers.ensureEventsDirExists(dir);
            const filePath = join(dirname(ProfileInfo.getZoweDir()), eventName);
            //possibly have to do some cleaning up of eventNames (custom ones might go crazy)
            eeInst.subscriptions.set(eventName, {
                eventTime: new Date().toISOString(),
                eventName,
                eventType,
                appName: eeInst.appName,
                eventFilePath: filePath
            });
            // returns a disposable to automatically unsubscribe as cleanup when app closes
            return { close: ()=> this.unsubscribe(eventName) };
        },
        writeEvent: function(event: Event) {
            const eventPath = join(ProfileInfo.getZoweDir(), event.eventFilePath);
            EventEmitter.Helpers.ensureEventsDirExists(eventPath);
            fs.writeFileSync(eventPath, JSON.stringify(event.toJson(), null, 2));
        }
    };

    public subscribeShared(eventName: string): void {
        const isCustom = EventEmitter.Helpers.isSharedEvent(eventName);
        const eventType = isCustom ? EventTypes.CustomSharedEvents : EventTypes.SharedEvents;
        const eeInst = EventEmitter.Helpers.getInstance(this.appName);
        EventEmitter.Helpers.createSubscription(eeInst, eventName, eventType);
    }

    public subscribeUser(eventName: string): void {
        const isCustom = EventEmitter.Helpers.isUserEvent(eventName);
        const eventType = isCustom ? EventTypes.CustomUserEvents : EventTypes.UserEvents;
        const eeInst = EventEmitter.Helpers.getInstance(this.appName);
        EventEmitter.Helpers.createSubscription(eeInst, eventName, eventType);
    }

    public emitEvent(eventName: string): void {
        // search for correct event emitter instance based on appname. if there isnt one for that app, create it then search
        // update the event file time for the event found via event.eventPath, write to the file
        const event = EventEmitter.Helpers.getEventDetails(eventName);
        if (!event) {
            this.logger.error(`No subscription found for event: ${eventName}`);
            return;
        }

        const fullEvent = {
            ...event,
            eventTime: new Date().toISOString() // Update time to reflect the emission time
        };
        EventEmitter.Helpers.writeEvent();
        this.logger.info(`Event emitted: ${JSON.stringify(fullEvent)}`);
    }

    // * Intentional Unsubscription from given event
    public unsubscribe(eventName: string): void {
        if (this.subscriptions.has(eventName)) {
            this.subscriptions.delete(eventName);
        } else {
            this.logger.error(`No subscription found for event: ${eventName}`);
        }
    }
}
