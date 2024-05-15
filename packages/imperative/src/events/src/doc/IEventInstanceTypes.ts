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
    BOTH = 'both'
}
