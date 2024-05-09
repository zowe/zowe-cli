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
import { EventEmitterManager } from "./EventEmitterManager";
import { EventTypes } from "./EventConstants";
import { ImperativeError } from "../../error/src/ImperativeError";
import { Event } from "./Event";

/**
 * The EventEmitter class is responsible for managing event subscriptions and emissions for a specific application.
 * It maintains a map of subscriptions where each event name is associated with its corresponding Event object.
 *
 * @export
 * @class EventEmitter
 */
export class EventEmitter {
    public subscriptions: Map<string, Event> = new Map();
    public appName: string;
    public logger: Logger;

    /**
     * Creates an instance of EventEmitter.
     *
     * @param {string} appName The name of the application this emitter is associated with.
     * @param {Logger} logger The logger instance used for logging information and errors.
     */
    public constructor(appName: string, logger: Logger) {
        this.subscriptions = new Map();
        this.appName = appName;
        this.logger = logger;
    }

    /**
     * Utility helpers from EventEmitterManager for managing events.
     */
    public utils = EventEmitterManager.Helpers;

    /**
     * Subscribes to a shared event. This method determines the event type and creates a subscription.
     *
     * @param {string} eventName
     */
    public subscribeShared(eventName: string): void {
        const isCustom = this.utils.isSharedEvent(eventName);
        const eventType = isCustom ? EventTypes.CustomSharedEvents : EventTypes.SharedEvents;
        this.utils.createSubscription(this, eventName, eventType);
    }

    /**
     * Subscribes to a user event. This method determines whether the event is custom and creates a subscription accordingly.
     *
     * @param {string} eventName
     */
    public subscribeUser(eventName: string): void {
        const isCustom = this.utils.isUserEvent(eventName);
        const eventType = isCustom ? EventTypes.CustomUserEvents : EventTypes.UserEvents;
        this.utils.createSubscription(this, eventName, eventType);
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
            const event = this.subscriptions.get(eventName);
            event.eventTime = new Date().toISOString();
            this.utils.writeEvent(event);
        } catch (err) {
            throw new ImperativeError({ msg: `Error writing event: ${eventName}`, causeErrors: err });
        }
    }

    /**
     * Unsubscribes from a given event by removing it from the subscriptions map.
     * Logs an error if the event name is not found in the subscriptions.
     *
     * @param {string} eventName
     */
    public unsubscribe(eventName: string): void {
        if (this.subscriptions.has(eventName)) {
            this.subscriptions.delete(eventName);
        } else {
            this.logger.error(`No subscription found for event: ${eventName}`);
        }
    }
}