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

import { EventEmitter } from "./EventEmitter";

/**
 * The EventEmitterManager class serves as a central hub for managing
 * event emitters and their watched events.
 *
 * @export
 * @class EventEmitterManager
 */
export class EventEmitterManager {
    private static instances: Map<string, EventEmitter> = new Map();

    /**
     * Retrieves an existing EventEmitter instance or creates a new one if it does not exist.
     * Ensures that each application has a unique EventEmitter instance.
     *
     * @static
     * @param {string} appName key to KVP for managed event emitter instances
     * @return {EventEmitter} Returns the EventEmitter instance
     */
    public static getEmitter(appName: string): EventEmitter {
        if (!this.instances.has(appName)) {
            const newInstance = new EventEmitter(appName);
            this.instances.set(appName, newInstance);
        }
        return this.instances.get(appName);
    }

    // TODO: Implement `logger` initialization for each emitter initialized
    //      `EEM.getEmitter(appName, {logger: ...})`
    // TODO: Implement `deleteEmitter` that applications can call when shutting down
    //      `EEM.deleteEmitter(appName)`
}