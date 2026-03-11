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

import { Constants } from "../../../constants";
import { ImperativeError } from "../../../error";
import type { IQueueItem } from "./doc/IQueueItem";
import type { IQueuePoolEntry } from "./doc/IQueuePoolEntry";
import type { IQueueThrottleOptions } from "./doc/IQueueThrottleOptions";

export class Queue {
    private readonly defaultQueue: string = "default";
    private mQueueTimeout: number = Constants.MAX_SIGNED_32BIT_NUMBER;
    private mMaxConcurrentRequests: number = Constants.MAX_SIGNED_32BIT_NUMBER;
    private mQueue: {[key: string]: IQueuePoolEntry} = {};

    constructor(options?: IQueueThrottleOptions) {
        if (options) { this.setThrottlingOptions(options); }
        this.createQueue();
    }

    /**
     * Changes and existing request queue's throttling options.
     * @param options - The throttling options to apply to the request queue.
     * @throws {ImperativeError} - when the options provided are out of bounds.
     */
    public setThrottlingOptions(options: IQueueThrottleOptions) {
        // Overwrite the throttling options.
        // Timeout changes will only apply to future requests, not ones in progress.
        if (options.maxConcurrentRequests != null) {
            if (options.maxConcurrentRequests <= 0) { throw new ImperativeError({msg: "Maximum concurrent requests cannot be 0 or lower."}); }
            this.mMaxConcurrentRequests = options.maxConcurrentRequests;
        }

        if (options.queueTimeout != null) {
            if (options.queueTimeout <= 0 || options.queueTimeout > Constants.MAX_SIGNED_32BIT_NUMBER) {
                throw new ImperativeError({msg: "Queue timeout must be between 0 and " + Constants.MAX_SIGNED_32BIT_NUMBER.toString() + "."});
            }
            this.mQueueTimeout = options.queueTimeout;
        }
    }

    /**
     * Add a promise to the queue
     * @param promiseFunction The promise, bound with all arguments, to execute on its turn in the queue.
     * @param poolId The queue pool that the promise should execute against
     * @returns The promise of the promiseFunction
     */
    public enqueue<T>(promiseFunction: Function, poolId?: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (!poolId) { poolId = this.defaultQueue; }

            // Create and use custom pool if pool is specified.
            if (!this.mQueue[poolId]) { this.createQueue(poolId); }

            // Create the request, and attach the timeout.
            const request: IQueueItem = {
                func: promiseFunction,
                timeout: setTimeout(() => { request.timedOut = true; }, this.mQueueTimeout),
                timedOut: false,
                resolve,
                reject
            };

            // Queue the request and run dequeue.
            this.mQueue[poolId].requestPool.push(request);
            this.dequeue(poolId);
        });
    }

    /**
     * Removes an item from the queue, checks if it times out, and executes the promise if valid
     * @param queue The pool of promises to execute against
     */
    private async dequeue(queue: string) {
        // Exit if there are no more requests in the queue or we are at the maximum number of requests in progress.
        if (!this.mQueue[queue].requestPool.length || this.mQueue[queue].inProgress >= this.mMaxConcurrentRequests) { return; }

        // Get the next item to process, and increment the inProgress counter.
        const execItem = this.mQueue[queue].requestPool.shift();
        this.mQueue[queue].inProgress++;

        try {
            // Try to process the item. If it timed out in the queue, throw an error and pick up the next one.
            if (execItem.timedOut) { throw new ImperativeError({msg: "Request timed out while in the request queue."}); }
            else { clearTimeout(execItem.timeout); }
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

    /**
     * Creates a new queue with the provided name. If none is provided, creates a "default" queue/
     * @param name The name of the queue to create
     */
    private createQueue(name: string = this.defaultQueue) {
        if (!this.mQueue[name]) { this.mQueue[name] = {inProgress: 0, requestPool: []}; } // Handle check again in case of race condition
    }
}
