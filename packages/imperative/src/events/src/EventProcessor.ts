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
import { EventCallback, EventTypes } from "./EventConstants";
import { ImperativeError } from "../../error/src/ImperativeError";
import { Event } from "./Event";
import { ConfigUtils } from "../../config/src/ConfigUtils";
import { LoggerManager } from "../../logger/src/LoggerManager";
import { ImperativeConfig } from "../../utilities";
import { EventUtils } from "./EventUtils";
import { IEventDisposable } from "./doc";
import { IProcessorTypes } from "./doc/IEventInstanceTypes";

/**
 * ## Overview
 * Each EventProcessor manages its own subscriptions, handling the addition, emission, and removal of events.
 * It uses a map where event names are keys, and values are Event objects that hold detailed event information and subscriptions.
 *
 * An `EventProcessor` handles three main functionalities:
 * - **Subscribing to Events**:
 *      Registration of a callback function that will be executed when that event occurs.
 * - **Emitting Events**:
 *      Notifying other applications or parts of the same application about certain actions or changes.
 * - **Managing Event Subscriptions**:
 *      Mapping subscribed events and their corresponding callbacks, ensuring that events are properly handled and dispatched.
 *
 * ### Understanding Event Types
 * - **Predefined Zowe Events**:
 *      Zowe provides a set of predefined shared and user events that can be watched.
 * - **Custom Events**:
 *      Applications can define their own shared and user events, allowing for custom event-driven behavior.
 *
 * @export
 * @class EventProcessor
 */
export class EventProcessor {
    public subscribedEvents: Map<string, Event> = new Map();
    public eventTimes: Map<string, string>;
    public processorType: IProcessorTypes;
    public appName: string;
    public logger: Logger;

    /**
     * Constructor initializes a new instance of EventProcessor.
     *
     * @param {string} appName - The application's name.
     * @param {IProcessorTypes} type - The type of processor (Emitter, Watcher, or Both).
     * @param {Logger} [logger] - Optional logger for recording events and errors.
     * @throws {ImperativeError} If the application name is not recognized.
     */
    public constructor(appName: string, type: IProcessorTypes, logger?: Logger) {
        EventUtils.validateAppName(appName);

        this.subscribedEvents = new Map();
        this.eventTimes = new Map();
        this.appName = appName;
        this.processorType = type;

        // Ensure correct environmental conditions to setup a custom logger,
        // otherwise use default logger
        if (ImperativeConfig.instance.loadedConfig == null || LoggerManager.instance.isLoggerInit === false) {
            ConfigUtils.initImpUtils("zowe");
        }
        this.logger = logger ?? Logger.getImperativeLogger();
    }

    private _subscribe(type: 'user' | 'shared', eventName: string, callbacks: EventCallback[] | EventCallback): IEventDisposable {
        if (this.processorType === IProcessorTypes.EMITTER) {
            throw new ImperativeError({ msg: `Processor does not have correct permissions: ${eventName}` });
        }

        let eventType;
        if (type === "shared") {
            eventType = EventUtils.isSharedEvent(eventName) ? EventTypes.ZoweSharedEvents : EventTypes.SharedEvents;
        } else if (type === "user") {
            eventType = EventUtils.isUserEvent(eventName) ? EventTypes.ZoweUserEvents : EventTypes.UserEvents;
        }

        const disposable = EventUtils.createSubscription(this, eventName, eventType);
        EventUtils.setupWatcher(this, eventName, callbacks);
        return disposable;
    }
    /**
     * Subscription to an event that will notify all subscribed users.
     *
     * @param {string} eventName - The name of the event to subscribe to.
     * @param {EventCallback[] | EventCallback} callbacks - Callback functions to handle the event.
     * @returns {IEventDisposable} - Object allowing management/cleanup of the subscription.
     * @throws {ImperativeError} If the processor does not have the correct permissions to perform this action.
     */
    public subscribeShared(eventName: string, callbacks: EventCallback[] | EventCallback): IEventDisposable {
        return this._subscribe("shared", eventName, callbacks);
    }

    /**
     * Subscription to an event that will notify a single user.
     *
     * @param {string} eventName - The name of the event to subscribe to.
     * @param {EventCallback[] | EventCallback} callbacks - Callback functions to handle the event.
     * @returns {IEventDisposable} - Object allowing management/cleanup of the subscription.
     * @throws {ImperativeError} If the processor does not have the correct permissions to perform this action.
     */
    public subscribeUser(eventName: string, callbacks: EventCallback[] | EventCallback): IEventDisposable {
        return this._subscribe("user", eventName, callbacks);
    }

    /**
     * Private method to emit the event
     * @private
     * @param eventName Event to be emitted
     * @throws {ImperativeError} - If the event cannot be emitted.
     */
    private emit(eventName: string) {
        try {
            const event = this.subscribedEvents.get(eventName) ?? EventUtils.createEvent(eventName, this.appName);
            event.eventTime = new Date().toISOString();
            EventUtils.writeEvent(event);
        } catch (err) {
            throw new ImperativeError({ msg: `Error writing event: ${eventName}`, causeErrors: err });
        }
    }

    /**
     * Emits an event by updating its timestamp and writing event data.
     *
     * @param {string} eventName - The name of the event to emit.
     * @throws {ImperativeError} If the processor does not have the correct permissions to perform this action.
     * @throws {ImperativeError} - If the event cannot be emitted.
     */
    public emitEvent(eventName: string): void {
        if (this.processorType === IProcessorTypes.WATCHER) {
            throw new ImperativeError({ msg: `Processor does not have correct permissions: ${eventName}` });
        }
        if (EventUtils.isUserEvent(eventName) || EventUtils.isSharedEvent(eventName)) {
            throw new ImperativeError({ msg: `Processor not allowed to emit Zowe events: ${eventName}` });
        }
        this.emit(eventName);
    }

    /**
     * Specifically emits Zowe-related events, updating timestamps and handling data.
     *
     * @internal Internal Zowe emitter method
     * @param {string} eventName - The name of the Zowe event to emit.
     * @throws {ImperativeError} If the processor does not have the correct permissions to perform this action.
     * @throws {ImperativeError} - If the event cannot be emitted.
     */
    public emitZoweEvent(eventName: string): void {
        if (this.appName !== "Zowe") {
            throw new ImperativeError({ msg: `Processor does not have Zowe permissions: ${eventName}` });
        }
        if (!EventUtils.isUserEvent(eventName) && !EventUtils.isSharedEvent(eventName)) {
            throw new ImperativeError({ msg: `Invalid Zowe event: ${eventName}` });
        }
        this.emit(eventName);
    }

    /**
     * Unsubscribes from an event, closing file watchers and cleaning up resources.
     *
     * @param {string} eventName - The name of the event to unsubscribe from.
     * @throws {ImperativeError} If the processor does not have the correct permissions to perform this action.
     * @throws {ImperativeError} - If unsubscribing fails.
     */
    public unsubscribe(eventName: string): void {
        if (this.processorType === IProcessorTypes.EMITTER) {
            throw new ImperativeError({ msg: `Processor does not have correct permissions: ${eventName}` });
        }
        const event = this.subscribedEvents.get(eventName);
        if (event) {
            event.subscriptions.forEach(subscription => {
                subscription.removeAllListeners(eventName);
                if (typeof subscription.close === 'function') {
                    subscription.close();
                }
            });
            this.subscribedEvents.delete(eventName);
        }
    }
}