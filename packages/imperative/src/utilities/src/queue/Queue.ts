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
import type { IQueueItem } from "./doc/IQueueItem";
import type { IQueuePool } from "./doc/IQueuePool";
import type { IQueueThrottleOptions } from "./doc/IQueueThrottleOptions";

export class Queue {
    public readonly max32BitIntegerSigned: number = 2147483647;
    public readonly defaultQueue: string = "default";
    private mQueueTimeout: number = this.max32BitIntegerSigned;
    private mMaxConcurrentRequests: number = this.max32BitIntegerSigned;
    private mQueue: IQueuePool = {};

    constructor(queueTimeout?: number, maxConcurrentRequests?: number) {
        if (queueTimeout) { this.mQueueTimeout = queueTimeout; }
        if (maxConcurrentRequests) { this.mMaxConcurrentRequests = maxConcurrentRequests; }
        this.createQueue();
    }

    public setThrottlingOptions(options: IQueueThrottleOptions) {
        // Overwrite the throttling options.
        // Timeout changes will only apply to future requests, not ones in progress.
        this.mMaxConcurrentRequests = options.maxConcurrentRequests;
        this.mQueueTimeout = options.queueTimeout;
    }

    public enqueue<T>(promiseFunction: Function, poolId?: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (!poolId) { poolId = this.defaultQueue; }

            // Create and use custom pool if pool is specified.
            if (!this.mQueue[poolId]) { this.createQueue(poolId); }

            // Create the request, and attach the timeout.
            const request: IQueueItem = {func: promiseFunction, timeout: undefined, timedOut: false, resolve, reject};
            const timeout = setTimeout(() => { request.timedOut = true; }, this.mQueueTimeout);
            request.timeout = timeout;

            // Queue the request and run dequeue.
            this.mQueue[poolId].requestPool.push(request);
            this.dequeue(poolId);
        });
    }

    private async dequeue(queue: string) {
        // Exit if there are no more requests in the queue or we are at the maximum number of requests in progress.
        if (!this.mQueue[queue].requestPool.length || this.mQueue[queue].inProgress >= this.mMaxConcurrentRequests) { return; }

        // Get the next item to process, and increment the inProgress counter.
        const execItem = this.mQueue[queue].requestPool.shift();
        this.mQueue[queue].inProgress++;

        try {
            // Try to process the item. If it timed out in the queue, throw an error and pick up the next one.
            if (execItem.timedOut) { throw new ImperativeError({msg: "Request timed out while in the request queue."}); }
            else { execItem.timeout.close(); }
            const result = await execItem.func();
            execItem.resolve(result);
        } catch (err) {
            execItem.reject(err);
        } finally {
            // Let's go again!
            this.mQueue[queue].inProgress--;
            this.dequeue(queue);
        }
    }

    private createQueue(name: string = this.defaultQueue) {
        this.mQueue[name] = {inProgress: 0, requestPool: []};
    }
}