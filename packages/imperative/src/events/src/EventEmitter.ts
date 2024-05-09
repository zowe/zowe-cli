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
import {
    IRegisteredAction,
    IEventEmitterOpts,
    IEventSubscriptionParms
} from "./doc";
import { ImperativeError } from "../../error/src/ImperativeError";
import * as Utilities from "./EventUtilities";
import { ConfigUtils } from "../../config/src/ConfigUtils";
import { LoggerManager } from "../../logger/src/LoggerManager";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { unsubscribe } from "diagnostics_channel";

/**
*The EventEmitter class is a scoped singleton class maintained by a maps of instances based on
*application names as keys that keep track of event subscriptions(stored event properties)
*until subscription removal.
*
*Subscription model: event metadata is stored in a map upon subscription.
*Upon emission, the event is looked up and the event time is updated to the current time
*to reflect this new event. The time change can be used to implement fileWatcher
*callback functions.
*/

export class EventEmitter {
    private static mInstance: EventEmitter;
    private static initialized = false;
    private subscriptions: Map< string, IEventSubscriptionParms> = new Map();
    public appName: string;
    public logger: Logger;

    /**
    /* Check to see if the  Event Emitter instance has been initialized
    */
    public static initialize(appName?: string, options?: IEventEmitterOpts) {
        if (this.initialized) {
            throw new ImperativeError({msg: "Only one instance of the Imperative Event Emitter is allowed"});
        }
        this.initialized = true;

        if (ImperativeConfig.instance.loadedConfig == null || LoggerManager.instance.isLoggerInit === false) {
            ConfigUtils.initImpUtils("zowe");
        }

        EventEmitter.instance.appName = appName;
        EventEmitter.instance.logger = options?.logger ?? Logger.getImperativeLogger();
    }

    public static get instance(): EventEmitter {
        if (this.mInstance == null) {
            this.mInstance = new EventEmitter();
            this.mInstance.subscriptions = new Map();
        }
        return this.mInstance;
    }

    /**
     * Check to see if the Imperative Event Emitter instance has been initialized
     */
    private ensureClassInitialized() {
        if (!EventEmitter.initialized) {
            throw new ImperativeError({msg: "You must initialize the instance before using any of its methods."});
        }
    }

    private initEvent(eventName: string): Event {
        this.ensureClassInitialized();
        return new Event({
            appName: this.appName,
            eventName,
            this.isCustomSharedEvent(eventName),
            logger: this.logger
        });
    }


    /**
     * Simple method to write the events to disk
     * @param eventName The name of event to write
     * @internal We do not want to make this function accessible to any application developers
     */
    public emitEvent(eventName: string) {
        const event: Event = this.initEvent(eventName);
        Utilities.writeEvent(event);
    }


    /**
     * Method to register your custom actions to a given event emission
     * @param eventName name of event to register custom action to
     * @param eventParms passed along parms to contribute to the overall event subscription data object
     */
    public subscribe(eventName: string, eventParms: IEventSubscriptionParms): IRegisteredAction {
        // HELP - why are we returning subscription.watcher.close?
        Utilities.ensureClassInitialized();
        const subscription = this.subscriptions.get(eventName);
        if (subscription != null){
            // modify existing subscription
            if (subscription.watcher != null){
                const watcherToClose = subscription.watcher;
                watcherToClose.removeAllListeners(eventName).close();
            }
            this.subscriptions.set(eventName, {
                ...subscription,
                //HELP - not sure if we should keep old callbacks? or overwrite with new:
                callbacks: [...subscription.callbacks, ...eventParms.callbacks],
                watcher: Utilities.setupWatcher(eventName),
                isCustomSharedEvent: eventParms.isCustomSharedEvent,
                eventTime: new Date().toISOString(),
            });
        } else {
            // create new subscription
            this.subscriptions.set(eventName, {
                callbacks: eventParms.callbacks, //callback has to be set before watcher
                watcher: Utilities.setupWatcher(eventName),
                eventType: Utilities.getEventType(eventName),
                isCustomSharedEvent: eventParms.isCustomSharedEvent,
                eventTime: new Date().toISOString(),
                dir: Utilities.getEventDir(Utilities.getEventType(eventName), this.appName)
            });
        }
        // returns a disposable to automatically unsubscribe as cleanup when app closes
        return { close: ()=> this.unsubscribe(eventName) };
    }

    /**
     * Unsubscribe from given event
     * @param eventName name of event
     */
    public unsubscribe(eventName: string): void {
        Utilities.ensureClassInitialized();
        if (this.subscriptions.has(eventName)) {
            this.subscriptions.get(eventName).watcher.removeAllListeners(eventName).close();
            this.subscriptions.delete(eventName);
        }
    }
}

// HELP -create an unsubscribe from all events for a given app?
//  - do this by deleting eventEmitter instance and all its associated files?