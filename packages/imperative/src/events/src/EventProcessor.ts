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
 * Manages event subscriptions and emissions for a specific application.
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
     */
    public constructor(appName: string, type: IProcessorTypes, logger?: Logger) {
        EventUtils.validateAppName(appName);

        this.subscribedEvents = new Map();
        this.appName = appName;
        this.processorType = type;

        // Ensure we have correct environmental conditions to setup a custom logger,
        // otherwise use default logger
        if (ImperativeConfig.instance.loadedConfig == null || LoggerManager.instance.isLoggerInit === false) {
            ConfigUtils.initImpUtils("zowe");
        }
        this.logger = logger ?? Logger.getImperativeLogger();
    }

    /**
     * Subscribes to shared events by creating and managing a new subscription.
     *
     * @param {string} eventName - The name of the event to subscribe to.
     * @param {EventCallback[] | EventCallback} callbacks - Callback functions to handle the event.
     * @returns {IEventDisposable} - Object allowing management of the subscription.
     */
    public subscribeShared(eventName: string, callbacks: EventCallback[] | EventCallback): IEventDisposable {
        if (this.processorType === IProcessorTypes.EMITTER) {
            throw new ImperativeError({ msg: `Processor does not have correct permissions: ${eventName}` });
        }
        const isZoweEvent = EventUtils.isSharedEvent(eventName);
        const eventType = isZoweEvent ? EventTypes.ZoweSharedEvents : EventTypes.SharedEvents;
        const disposable = EventUtils.createSubscription(this, eventName, eventType);
        EventUtils.setupWatcher(this, eventName, callbacks);
        return disposable;
    }

    /**
    * Subscribes to user-specific events by creating and managing a new subscription.
    *
    * @param {string} eventName - The name of the event to subscribe to.
    * @param {EventCallback[] | EventCallback} callbacks - Callback functions to handle the event.
    * @returns {IEventDisposable} - Object allowing management of the subscription.
    */
    public subscribeUser(eventName: string, callbacks: EventCallback[] | EventCallback): IEventDisposable {
        if (this.processorType === IProcessorTypes.EMITTER) {
            throw new ImperativeError({ msg: `Processor does not have correct permissions: ${eventName}` });
        }
        const isZoweEvent = EventUtils.isUserEvent(eventName);
        const eventType = isZoweEvent ? EventTypes.ZoweUserEvents : EventTypes.UserEvents;
        const disposable = EventUtils.createSubscription(this, eventName, eventType);
        EventUtils.setupWatcher(this, eventName, callbacks);
        return disposable;
    }

    /**
     * Emits an event by updating its timestamp and writing event data.
     *
     * @param {string} eventName - The name of the event to emit.
     * @throws {ImperativeError} - If the event cannot be emitted.
     */
    public emitEvent(eventName: string): void {
        if (this.processorType === IProcessorTypes.WATCHER) {
            throw new ImperativeError({ msg: `Processor does not have correct permissions: ${eventName}` });
        }
        if (EventUtils.isUserEvent(eventName) || EventUtils.isSharedEvent(eventName)) {
            throw new ImperativeError({ msg: `Processor not allowed to emit Zowe events: ${eventName}` });
        }
        try {
            const event = this.subscribedEvents.get(eventName);
            event.eventTime = new Date().toISOString();
            EventUtils.writeEvent(event);
        } catch (err) {
            throw new ImperativeError({ msg: `Error writing event: ${eventName}`, causeErrors: err });
        }
    }

    /**
     * Specifically emits Zowe-related events, updating timestamps and handling data.
     *
     * @internal Internal Zowe emitter method
     * @param {string} eventName - The name of the Zowe event to emit.
     * @throws {ImperativeError} - If the event cannot be emitted.
     */
    public emitZoweEvent(eventName: string): void {
        if (this.processorType === IProcessorTypes.WATCHER) {
            throw new ImperativeError({ msg: `Processor does not have correct permissions: ${eventName}` });
        }
        try {
            const event = this.subscribedEvents.get(eventName);
            event.eventTime = new Date().toISOString();
            EventUtils.writeEvent(event);
        } catch (err) {
            throw new ImperativeError({ msg: `Error writing event: ${eventName}`, causeErrors: err });
        }
    }

    /**
     * Unsubscribes from an event, closing file watchers and cleaning up resources.
     *
     * @param {string} eventName - The name of the event to unsubscribe from.
     * @throws {ImperativeError} - If unsubscribing fails.
     */
    public unsubscribe(eventName: string): void {
        if (this.processorType === IProcessorTypes.EMITTER) {
            throw new ImperativeError({ msg: `Processor does not have correct permissions: ${eventName}` });
        }
        try {
            // find watcher list and close everything
            this.subscribedEvents.get(eventName).subscriptions.forEach((watcher) => {
                watcher.removeAllListeners(eventName).close();
            });
            this.subscribedEvents.delete(eventName);
        } catch (err) {
            throw new ImperativeError({ msg: `Error unsubscribing from event: ${eventName}`, causeErrors: err });
        }
    }
}