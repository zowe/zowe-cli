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

import { EventProcessor } from "./EventProcessor";
import { IEmitter, IEmitterAndWatcher, IProcessorTypes, IWatcher } from "./doc/IEventInstanceTypes";
import { Logger } from "../../logger";

/**
 * The EventEmitterManager class serves as a central hub for managing
 * event emitters and their watched events.
 *
 * @export
 * @class EventEmitterManager
 */
export class EventOperator {
    private static instances: Map<string, EventProcessor> = new Map();

    /**
     * Closes and removes processor's file watchers.
     * Cleans up environment by deleting the processor instance.
     *
     * @static
     * @param {string} appName key to KVP for managed event processor instances
     * @return {EventProcessor} Returns the EventProcessor instance
     */
    private static destroyProcessor(appName: string): void {
        if (this.instances.has(appName)) {
            const processor = this.instances.get(appName);
            processor.subscribedEvents.forEach((event, eventName) => {
                event.subscriptions.forEach((subscription) => {
                    subscription.removeAllListeners(eventName).close();
                });
            });
            this.instances.delete(appName);
        }
    }

    /**
     *
     * @static
     * @param {string} appName key to KVP for managed event processor instances
     * @return {EventProcessor} Returns the EventProcessor instance
     */
    private static createProcessor(appName: string, type: IProcessorTypes, logger?: Logger): IEmitterAndWatcher {
        if (!this.instances.has(appName) ) {
            const newInstance = new EventProcessor(appName, type, logger);
            this.instances.set(appName, newInstance);
        }
        return this.instances.get(appName);
    }

    /**
     *
     * @static
     * @param {string} appName key to KVP for managed event processor instances
     * @return {EventProcessor} Returns the EventProcessor instance
     */
    public static getProcessor(appName: string,  logger?: Logger): IEmitterAndWatcher {
        return this.createProcessor(appName, IProcessorTypes.BOTH, logger);
    }

    /**
     *
     * @static
     * @param {string} appName key to KVP for managed event processor instances
     * @return {EventProcessor} Returns the EventProcessor instance
     */
    public static getWatcher(appName: string,  logger?: Logger): IWatcher {
        return this.createProcessor(appName, IProcessorTypes.WATCHER, logger);
    }

    /**
     *
     * @static
     * @param {string} appName key to KVP for managed event processor instances
     * @return {EventProcessor} Returns the EventProcessor instance
     */
    public static getEmitter(appName: string, logger?: Logger): IEmitter {
        return this.createProcessor(appName, IProcessorTypes.EMITTER, logger);
    }

    /**
     *
     * @static
     * @param {string} appName key to KVP for managed event processor instances
     * @return {EventProcessor} Returns the EventProcessor instance
     */
    public static deleteProcessor(appName: string) {
        this.destroyProcessor(appName);
    }

    /**
     *
     * @static
     * @param {string} appName key to KVP for managed event processor instances
     * @return {EventProcessor} Returns the EventProcessor instance
     */
    public static deleteWatcher(appName: string) {
        this.destroyProcessor(appName);
    }

    /**
     *
     * @static
     * @param {string} appName key to KVP for managed event processor instances
     * @return {EventProcessor} Returns the EventProcessor instance
     */
    public static deleteEmitter(appName: string) {
        this.destroyProcessor(appName);
    }
}