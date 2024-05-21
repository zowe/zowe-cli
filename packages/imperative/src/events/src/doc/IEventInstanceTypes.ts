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

import { EventCallback } from "../EventConstants";
import { IEventDisposable } from "./IEventDisposable";

/**
 * Interface for components that can subscribe to and unsubscribe from events.
 * @interface IWatcher
 */
export interface IWatcher {
    subscribeShared(eventName: string, callbacks: EventCallback[] | EventCallback): IEventDisposable;
    subscribeUser(eventName: string, callbacks: EventCallback[] | EventCallback): IEventDisposable;
    unsubscribe(eventName: string): void;
}

/**
 * Interface for components that can emit events.
 * @interface IEmitter
 */
export interface IEmitter {
    emitEvent(eventName: string): void;
}

/**
 * Interface for components that can both emit and watch events.
 * Combines the capabilities of both IWatcher and IEmitter interfaces.
 * @interface IEmitterAndWatcher
 */
export interface IEmitterAndWatcher extends IWatcher, IEmitter {}

/**
 * Enum representing the types of processors that can be used to handle events.
 * Specifies whether the processor is a watcher, an emitter, or capable of both functions.
 * @enum {string}
 */
export enum IProcessorTypes {
    WATCHER = 'watcher',
    EMITTER = 'emitter',
    BOTH = 'both',
}