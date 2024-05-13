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

import { Logger } from "../../logger/src/Logger";
import { EventTypes } from "./EventConstants";
import { ImperativeError } from "../../error/src/ImperativeError";
import { Event } from "./Event";
import { ConfigUtils } from "../../config/src/ConfigUtils";
import { LoggerManager } from "../../logger/src/LoggerManager";
import { ImperativeConfig } from "../../utilities";
import { EventUtils } from "./EventUtils";

/**
 * The EventEmitter class is responsible for managing event subscriptions and emissions for a specific application.
 * It maintains a map of subscriptions where each event name is associated with its corresponding Event object.
 *
 * @export
 * @class EventEmitter
 */
export class EventEmitter {
    public events: Map<string, Event> = new Map();
    public eventTimes: Map<string, string>;
    public appName: string;
    public logger: Logger;

    /**
     * Creates an instance of EventEmitter.
     *
     * @param {string} appName The name of the application this emitter is associated with.
     * @param {Logger} logger The logger instance used for logging information and errors.
     */
    public constructor(appName: string, logger?: Logger) {
        this.events = new Map();
        this.appName = appName;

        // Ensure we have correct environmental conditions to setup a custom logger,
        // otherwise use default logger
        if (ImperativeConfig.instance.loadedConfig == null || LoggerManager.instance.isLoggerInit === false) {
            ConfigUtils.initImpUtils("zowe");
        }
        this.logger = logger ?? Logger.getImperativeLogger();
    }

    /**
     * Utility helpers from EventEmitterManager for managing events.
     */

    /**
     * Subscribes to a shared event. This method determines the event type and creates a subscription.
     *
     * @param {string} eventName
     */
    public subscribeShared(eventName: string): void {
        const isCustom = EventUtils.isSharedEvent(eventName);
        const eventType = isCustom ? EventTypes.CustomSharedEvents : EventTypes.SharedEvents;
        EventUtils.createSubscription(this, eventName, eventType);
    }

    /**
     * Subscribes to a user event. This method determines whether the event is custom and creates a subscription accordingly.
     *
     * @param {string} eventName
     */
    public subscribeUser(eventName: string, callbacks: Function[]): void {
        const isCustom = EventUtils.isUserEvent(eventName);
        const eventType = isCustom ? EventTypes.CustomUserEvents : EventTypes.UserEvents;
        EventUtils.createSubscription(this, eventName, eventType);
        EventUtils.setupWatcher(this, eventName, callbacks);
    }

    /**
     * Emits an event by updating the event time and writing the event data to the associated event file.
     * This method throws an error if the event cannot be written.
     *
     * @param {string} eventName
     * @throws {ImperativeError}
     */
    public emitEvent(eventName: string): void {
        try {
            const event = this.events.get(eventName);
            event.eventTime = new Date().toISOString();
            EventUtils.writeEvent(event);
        } catch (err) {
            throw new ImperativeError({ msg: `Error writing event: ${eventName}`, causeErrors: err });
        }
    }

    /**
     * Unsubscribes from a given event by closing the file watchers associated with that event THEN
     * deleting that event from the EventEmitter's events map.
     * Logs an error if eventName isn't found.
     *
     * @param {string} eventName
     */
    public unsubscribe(eventName: string): void {
        try{
            // find watcher list and close everything
            this.events.get(eventName).subscriptions.forEach((watcher)=>{
                watcher.removeAllListeners(eventName).close();
            });
            this.events.delete(eventName);
        } catch(err){
            throw new ImperativeError({ msg: `Error unsubscribing from event: ${eventName}`, causeErrors: err });
        }
    }
}