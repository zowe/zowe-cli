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
    IImperativeRegisteredAction,
    IImperativeEventEmitterOpts,
    IEventSubscriptionParms
} from "./doc";
import { ImperativeError } from "../../error/src/ImperativeError";
import * as Utilities from "./Utilities";

export class ImperativeEventEmitter {
    private static mInstance: ImperativeEventEmitter;
    private initialized = false;
    private subscriptions: Map< string, IEventSubscriptionParms> = new Map();
    public appName: string;
    public logger: Logger;

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
     * Simple method to write the events to disk
     * @param eventName The name of event to write
     * @internal We do not want to make this function accessible to any application developers
     */
    public emitEvent(eventName: string) {
        const event = Utilities.initEvent(eventName);
        Utilities.writeEvent(event.path, event);
    }


    /**
     * Method to register your custom actions to a given event emission
     * @param eventName name of event to register custom action to
     * @param eventParms passed along parms to contribute to the overall event subscription data object
     */
    public subscribe(eventName: string, eventParms: IEventSubscriptionParms): IImperativeRegisteredAction {
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
                isCustomShared: eventParms.isCustomShared,
                eventTime: new Date().toISOString(),
            });
        } else {
            // create new subscription
            this.subscriptions.set(eventName, {
                callbacks: eventParms.callbacks, //callback has to be set before watcher
                watcher: Utilities.setupWatcher(eventName),
                eventType: Utilities.getEventType(eventName),
                isCustomShared: eventParms.isCustomShared,
                eventTime: new Date().toISOString(),
                dir: Utilities.getEventDir(Utilities.getEventType(eventName), this.appName)
            });
        }
        return { close: subscription.watcher.close };
    }

    /**
     * Unsubscribe from any given event
     * @param eventName name of event
     */
    public unsubscribe(eventName: string): void {
        Utilities.ensureClassInitialized();
        if (this.subscriptions.has(eventName)) {
            this.subscriptions.get(eventName).watcher.removeAllListeners(eventName).close();
            this.subscriptions.delete(eventName);
        }
    }
