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

/**
 * @internal Interface to allow for internal Zowe event emission
 */
interface IZoweProcessor extends IEmitterAndWatcher {
    emitZoweEvent(eventName: string): void;
}

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
    private static createProcessor(appName: string, type: IProcessorTypes, logger?: Logger): IZoweProcessor {
        const appList = this.getListOfApps();
        // Allow for the Zowe processor and processors in the list of apps installed on the system
        if (appName !== "Zowe" && !appList.includes(appName)) {
            throw new ImperativeError({
                msg: `Application name not found: ${appName}` +
                `Please use an application name from the list:\n- ${appList.join("\n- ")}`
            });
        }

        if (!this.instances.has(appName) ) {
            const newInstance = new EventProcessor(appName, type, logger);
            this.instances.set(appName, newInstance);
        }
        return this.instances.get(appName);
    }

    /**
     *
     * @internal
     * @static
     * @param {string} appName key to KVP for managed event processor instances
     * @return {EventProcessor} Returns the EventProcessor instance
     */
    public static getZoweProcessor(): IZoweProcessor {
        return this.createProcessor("Zowe", IProcessorTypes.BOTH, Logger.getAppLogger());
    }


    /**
     *
     * @static
     * @return {string[]}
     */
    public static getListOfApps(): string[] {
        const extendersJson = ConfigUtils.readExtendersJsonFromDisk();
        return Object.keys(extendersJson.profileTypes);
        /**
         * TODO: Do we want them to use the any of the following identifiers as the appName?
         *   - plug-in name,
         *   - VSCode extension ID,
         *   - a user-friendly name (e.g. Zowe Explorer)
         *   - nothing but the profile types (e.g. sample, zftp, cics, ...)
         */
        // const apps: string[] = [];
        // for (const [profileType, source] of Object.entries(extendersJson.profileTypes)) {
        //     apps.push(profileType);
        //     apps.push(...source.from);
        // }
        // return apps;
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
    public static getWatcher(appName: string = "Zowe",  logger?: Logger): IWatcher {
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