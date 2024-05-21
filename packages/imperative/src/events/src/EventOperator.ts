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
import { ConfigUtils } from "../../config/src/ConfigUtils";
import { ImperativeError } from "../../error/src/ImperativeError";
import { EventUtils } from "./EventUtils";

/**
 *  @internal Interface for Zowe-specific event processing, combining emitter and watcher functionalities.
 */
interface IZoweProcessor extends IEmitterAndWatcher {
    emitZoweEvent(eventName: string): void;
}

/**
 * Manages event processors for different applications, facilitating subscription,
 * emission, and watching of events.
 *
 * @export
 * @class EventOperator
 */
export class EventOperator {
    private static instances: Map<string, EventProcessor> = new Map();

    /**
     * Creates an event processor for a specified application.
     *
     * @static
     * @param {string} appName - The name of the application.
     * @param {IProcessorTypes} type - The type of processor to create (emitter, watcher, or both).
     * @param {Logger} [logger] - Optional logger instance for the processor.
     * @returns {IZoweProcessor} A new or existing processor instance.
     * @throws {ImperativeError} If the application name is not recognized.
     */
    private static createProcessor(appName: string, type: IProcessorTypes, logger?: Logger): IZoweProcessor {
        EventUtils.validateAppName(appName);

        if (!this.instances.has(appName)) {
            const newInstance = new EventProcessor(appName, type, logger);
            this.instances.set(appName, newInstance);
        }
        return this.instances.get(appName);
    }

    /**
     * Retrieves a Zowe-specific event processor.
     *
     * @internal
     * @static
     * @returns {IZoweProcessor} The Zowe event processor instance.
     */
    public static getZoweProcessor(): IZoweProcessor {
        return this.createProcessor("Zowe", IProcessorTypes.BOTH, Logger.getAppLogger());
    }

    /**
     * Retrieves a generic event processor that can emit and watch events.
     *
     * @static
     * @param {string} appName - The application name.
     * @param {Logger} [logger] - Optional logger for the processor.
     * @returns {IEmitterAndWatcher} An event processor capable of both emitting and watching.
     */
    public static getProcessor(appName: string, logger?: Logger): IEmitterAndWatcher {
        EventUtils.validateAppName(appName);
        return this.createProcessor(appName, IProcessorTypes.BOTH, logger);
    }

    /**
     * Retrieves a watcher-only event processor.
     *
     * @static
     * @param {string} appName - The application name, defaults to "Zowe" if not specified.
     * @param {Logger} [logger] - Optional logger for the processor.
     * @returns {IWatcher} A watcher-only event processor.
     */
    public static getWatcher(appName: string = "Zowe", logger?: Logger): IWatcher {
        EventUtils.validateAppName(appName);
        return this.createProcessor(appName, IProcessorTypes.WATCHER, logger);
    }

    /**
     * Retrieves an emitter-only event processor.
     *
     * @static
     * @param {string} appName - The application name.
     * @param {Logger} [logger] - Optional logger for the processor.
     * @returns {IEmitter} An emitter-only event processor.
     */
    public static getEmitter(appName: string, logger?: Logger): IEmitter {
        EventUtils.validateAppName(appName);
        return this.createProcessor(appName, IProcessorTypes.EMITTER, logger);
    }

    /**
     * Deletes a specific type of event processor (emitter).
     *
     * @static
     * @param {string} appName - The application name associated with the emitter to be deleted.
     */
    public static deleteEmitter(appName: string): void {
        EventUtils.validateAppName(appName);
        this.destroyProcessor(appName);
    }

    /**
     * Deletes a specific type of event processor (watcher).
     *
     * @static
     * @param {string} appName - The application name associated with the watcher to be deleted.
     */
    public static deleteWatcher(appName: string): void {
        EventUtils.validateAppName(appName);
        this.destroyProcessor(appName);
    }

    /**
     * Deletes an event processor, removing both its emitter and watcher capabilities.
     *
     * @static
     * @param {string} appName - The application name whose processor is to be deleted.
     */
    public static deleteProcessor(appName: string): void {
        EventUtils.validateAppName(appName);
        this.destroyProcessor(appName);
    }

    /**
     * Destroys a processor by removing all associated file watchers and cleaning up resources.
     *
     * @static
     * @param {string} appName - The name of the application whose processor needs to be destroyed.
     */
    private static destroyProcessor(appName: string): void {
        EventUtils.validateAppName(appName);
        const processor = this.instances.get(appName);
        if (processor) {
            processor.subscribedEvents.forEach((event, eventName) => {
                event.subscriptions.forEach(subscription => subscription.removeAllListeners(eventName).close());
            });
            this.instances.delete(appName);
        }
    }
}