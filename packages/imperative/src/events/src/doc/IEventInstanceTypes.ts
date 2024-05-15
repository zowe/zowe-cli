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
import { IDisposableAction } from "./IDisposableAction";

export interface IWatcher {
    subscribeShared(eventName: string, callbacks: EventCallback[] | EventCallback): IDisposableAction;
    subscribeUser(eventName: string, callbacks: EventCallback[] | EventCallback): IDisposableAction;
    unsubscribe(eventName: string): void;
}

export interface IEmitter {
    emitEvent(eventName: string): void;
}

export interface IEmitterAndWatcher extends IWatcher, IEmitter {}

export enum IProcessorTypes {
    WATCHER = 'watcher',
    EMITTER = 'emitter',
    BOTH = 'both',
    //ZOWE = 'zowe'
}
