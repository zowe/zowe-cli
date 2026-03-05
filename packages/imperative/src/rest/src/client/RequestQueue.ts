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

import { ImperativeError } from "../../../error";
import { ISession } from "../session/doc/ISession";
import { IRequestThrottleOptions } from "./doc/IRequestThrottleOptions";
import { IRestOptions } from "./doc/IRestOptions";

export interface IRequestQueuePool {
    [key: string]: IRequestQueuePoolEntry
}

export interface IRequestQueuePoolEntry {
    inProgress: number,
    requestPool: IRequestQueueItem[]
}

export interface IRequestQueueItem {
    func: Function,
    args: IRestOptions,
    timeout: NodeJS.Timeout,
    timedOut: boolean,
    resolve: any
    reject: any
}

export const RequestResolverTimeout = 250;

export class RequestQueue {
    public readonly max32BitIntegerSigned: number = 2147483647;
    public readonly defaultQueue: string = "default";
    private mQueueTimeout: number = this.max32BitIntegerSigned;
    private mMaxConcurrentRequests: number = this.max32BitIntegerSigned;
    private mRequestQueue: IRequestQueuePool = {};

    constructor(queueTimeout?: number, maxConcurrentRequests?: number) {
        if (queueTimeout) { this.mQueueTimeout = queueTimeout; }
        if (maxConcurrentRequests) { this.mMaxConcurrentRequests = maxConcurrentRequests; }
        this.createQueue();
    }

    public setThrottlingOptions(options: IRequestThrottleOptions) {
        // Overwrite the throttling options.
        // Timeout changes will only apply to future requests, not ones in progress.
        this.mMaxConcurrentRequests = options.maxRequestCount;
        this.mQueueTimeout = options.queueTimeout;
    }

    public enqueue<T>(promiseFunction: Function, args: IRestOptions, session?: ISession): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // Implement a singular pool in case there is no pool mechanism
            let requestKey = this.defaultQueue;

            // Create and use custom pools if the required functions and options are set.
            if (session && session.hostname) {
                requestKey = session.hostname;
                if (session.port) { requestKey += ":" + session.port.toString(); }
                if (!this.mRequestQueue[requestKey]) { this.createQueue(requestKey); }
            }

            // Create the request, and attach the timeout.
            const request: IRequestQueueItem = {func: promiseFunction, args, timeout: undefined, timedOut: false, resolve, reject};
            const timeout = setTimeout(() => { request.timedOut = true; }, this.mQueueTimeout);
            request.timeout = timeout;

            // Queue the request and run dequeue.
            this.mRequestQueue[requestKey].requestPool.push(request);
            this.dequeue(requestKey);
        });
    }

    private async dequeue(queue: string) {
        // Exit if there are no more requests in the queue
        // or we are at the maximum number of requests in progress.
        if (!this.mRequestQueue[queue].requestPool.length || this.mRequestQueue[queue].inProgress >= this.mMaxConcurrentRequests) { return; }

        // Get the next item to process, and increment the inProgress counter.
        const execItem = this.mRequestQueue[queue].requestPool.shift();
        this.mRequestQueue[queue].inProgress++;

        try {
            // Try to process the item. If it timed out in the queue,
            // throw an error and pick up the next one.
            if (execItem.timedOut) { throw new ImperativeError({msg: "Request timed out while in the request queue."}); }
            else { execItem.timeout.close(); }
            const result = await execItem.func(execItem.args);
            execItem.resolve(result);
        } catch (err) {
            execItem.reject(err);
        } finally {
            this.mRequestQueue[queue].inProgress--;
            this.dequeue(queue);
        }
    }

    private createQueue(name: string = this.defaultQueue) {
        this.mRequestQueue[name] = this.createEmptyPool();
    }

    private createEmptyPool(): IRequestQueuePoolEntry {
        return {inProgress: 0, requestPool: []};
    }
}