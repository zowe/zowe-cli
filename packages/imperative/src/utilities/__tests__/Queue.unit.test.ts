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

import { ImperativeError } from "../../error";
import { Constants } from "../../constants";
import { Queue } from "../src/queue/Queue";
import type { IQueueItem } from "../src/queue/doc/IQueueItem";

async function timerPromiseResolve(ms: number = 5) {
    return new Promise<string>((resolve) => {
        setTimeout(()=>{resolve("done");}, ms);
    });
}

async function timerPromiseReject(ms: number = 5) {
    return new Promise<string>((_resolve, reject) => {
        setTimeout(()=>{reject(new ImperativeError({msg: "done"}));}, ms);
    });
}

async function neverResolvePromise() {
    return new Promise(()=>{});
}

function createRequest(succeed: boolean = true): IQueueItem & {promise: Promise<string>} {
    let res, rej;
    const promise = new Promise<string>((resolve, reject) => {
        res = resolve;
        rej = reject;
    });
    const func = succeed ? timerPromiseResolve : timerPromiseReject;
    const request: IQueueItem & {promise: Promise<string>} = {
        func,
        promise,
        timeout: setTimeout(()=>{request.timedOut = true;},2),
        timedOut: false,
        resolve: res,
        reject: rej
    };
    return request;
}

describe("Queue", () => {
    describe("constructor", () => {
        it("should initialize with the proper defaults", () => {
            const queue = new Queue();

            expect((queue as any).mQueueTimeout).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mMaxConcurrentRequests).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});
        });

        it("should initialize with custom settings", () => {
            const queue = new Queue({queueTimeout: 1, maxConcurrentRequests: 1});

            expect((queue as any).mQueueTimeout).toEqual(1);
            expect((queue as any).mMaxConcurrentRequests).toEqual(1);
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});
        });
    });


    describe("createQueue", () => {
        it("should create the default queue", () => {
            const queue = new Queue();
            (queue as any).mQueue = {};
            expect((queue as any).mQueue).toEqual({});

            (queue as any).createQueue();
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});
        });

        it("should create a named queue", () => {
            const queue = new Queue();
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});

            (queue as any).createQueue("testQueue");
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}, "testQueue": {inProgress: 0, requestPool: []}});
        });

        it("should not overwrite an existing queue", () => {
            const queue = new Queue();
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});

            (queue as any).mQueue["default"].inProgress = 1;
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 1, requestPool: []}});

            (queue as any).createQueue("default");
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 1, requestPool: []}});
        });
    });

    describe("setThrottlingOptions", () => {
        it("should apply throttling options to an existing queue", () => {
            const queue = new Queue();

            expect((queue as any).mQueueTimeout).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mMaxConcurrentRequests).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});

            queue.setThrottlingOptions({maxConcurrentRequests: 1, queueTimeout: 1000});

            expect((queue as any).mQueueTimeout).toEqual(1000);
            expect((queue as any).mMaxConcurrentRequests).toEqual(1);
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});
        });

        it("should apply one throttling option at a time - max concurrent requests", () => {
            const queue = new Queue();

            expect((queue as any).mQueueTimeout).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mMaxConcurrentRequests).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});

            queue.setThrottlingOptions({maxConcurrentRequests: 1});

            expect((queue as any).mQueueTimeout).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mMaxConcurrentRequests).toEqual(1);
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});
        });

        it("should apply one throttling option at a time - queue timeout", () => {
            const queue = new Queue();

            expect((queue as any).mQueueTimeout).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mMaxConcurrentRequests).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});

            queue.setThrottlingOptions({queueTimeout: 1000});

            expect((queue as any).mQueueTimeout).toEqual(1000);
            expect((queue as any).mMaxConcurrentRequests).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
            expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});
        });

        it("should handle an out of bounds exception - max concurrent requests", () => {
            const queue = new Queue();
            let error: any;

            try {
                queue.setThrottlingOptions({maxConcurrentRequests: 0});
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(ImperativeError);
            expect(error.message).toContain("0 or lower");
        });

        it("should handle an out of bounds exception - timeout - over", () => {
            const queue = new Queue();
            let error: any;

            try {
                queue.setThrottlingOptions({queueTimeout: Constants.MAX_SIGNED_32BIT_NUMBER + 1});
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(ImperativeError);
            expect(error.message).toContain(Constants.MAX_SIGNED_32BIT_NUMBER.toString());
        });

        it("should handle an out of bounds exception - timeout - under", () => {
            const queue = new Queue();
            let error: any;

            try {
                queue.setThrottlingOptions({queueTimeout: 0});
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(ImperativeError);
            expect(error.message).toContain(Constants.MAX_SIGNED_32BIT_NUMBER.toString());
        });
    });

    describe("enqueue", () => {
        beforeAll(() => {
            // Disable timeouts for the tests.
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        afterAll(() => {
            // Use the real timers
            jest.useRealTimers();
        });

        it("should add an item to the queue", () => {
            const localQueue = new Queue();
            const dequeueSpy = jest.spyOn(localQueue as any, "dequeue").mockImplementation();
            const createQueueSpy = jest.spyOn(localQueue as any, "createQueue");

            localQueue.enqueue(neverResolvePromise);

            expect((localQueue as any).mQueue).toEqual({
                default: {
                    inProgress: 0,
                    requestPool: [expect.objectContaining({
                        func: neverResolvePromise,
                        timedOut: false
                    })]
                }
            });
            expect((localQueue as any).mQueue["default"].requestPool[0].timeout).toBeInstanceOf(setTimeout(()=>{}).constructor);
            expect(dequeueSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledWith("default");
            expect(createQueueSpy).toHaveBeenCalledTimes(0);
        });

        it("should add an item to a custom queue pool", () => {
            const localQueue = new Queue();
            const dequeueSpy = jest.spyOn(localQueue as any, "dequeue").mockImplementation();
            const createQueueSpy = jest.spyOn(localQueue as any, "createQueue");

            localQueue.enqueue(neverResolvePromise, "custom");

            expect((localQueue as any).mQueue).toEqual({
                default: {
                    inProgress: 0,
                    requestPool: []
                },
                custom: {
                    inProgress: 0,
                    requestPool: [expect.objectContaining({
                        func: neverResolvePromise,
                        timedOut: false
                    })]
                }
            });
            expect((localQueue as any).mQueue["custom"].requestPool[0].timeout).toBeInstanceOf(setTimeout(()=>{}).constructor);
            expect(dequeueSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledWith("custom");
            expect(createQueueSpy).toHaveBeenCalledTimes(1);
            expect(createQueueSpy).toHaveBeenCalledWith("custom");
        });

        it("should allow the timeout to set a property on the queue item", () => {
            const localQueue = new Queue({queueTimeout: 1000});
            const dequeueSpy = jest.spyOn(localQueue as any, "dequeue").mockImplementation();
            const createQueueSpy = jest.spyOn(localQueue as any, "createQueue");

            localQueue.enqueue(neverResolvePromise);
            jest.advanceTimersByTime(1000);

            expect((localQueue as any).mQueue).toEqual({
                default: {
                    inProgress: 0,
                    requestPool: [expect.objectContaining({
                        func: neverResolvePromise,
                        timedOut: true
                    })]
                }
            });
            expect((localQueue as any).mQueue["default"].requestPool[0].timeout).toBeInstanceOf(setTimeout(()=>{}).constructor);
            expect(dequeueSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledWith("default");
            expect(createQueueSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe("dequeue", () => {

        beforeAll(() => {
            // Disable timeouts for the tests.
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        afterAll(() => {
            // Use the real timers
            jest.useRealTimers();
        });

        it("should skip if there is nothing on the queue", async () => {
            const localQueue = new Queue();
            (localQueue as any).mQueue["default"] = {inProgress: 0, requestPool: []};

            const shiftSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool, "shift");
            const dequeueSpy = jest.spyOn(localQueue as any, "dequeue");
            (localQueue as any).dequeue("default");

            expect(shiftSpy).toHaveBeenCalledTimes(0);
            expect(dequeueSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledWith("default");
        });

        it("should skip if the number of requests in progress matches max concurrent", async () => {
            const localQueue = new Queue();
            localQueue.setThrottlingOptions({maxConcurrentRequests: 2});

            const request = createRequest();
            (localQueue as any).mQueue["default"] = {inProgress: 2, requestPool: [request]};

            const shiftSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool, "shift");
            const dequeueSpy = jest.spyOn(localQueue as any, "dequeue");
            (localQueue as any).dequeue("default");

            expect(shiftSpy).toHaveBeenCalledTimes(0);
            expect(dequeueSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledWith("default");

            expect((localQueue as any).mQueue["default"].inProgress).toEqual(2);
            expect((localQueue as any).mQueue["default"].requestPool.length).toEqual(1);
            expect((localQueue as any).mQueue["default"].requestPool[0]).toEqual(request);
            expect((localQueue as any).mQueue["default"].requestPool[0].func).toEqual(timerPromiseResolve);
            expect((localQueue as any).mQueue["default"].requestPool[0].timeout).toBeInstanceOf(setTimeout(()=>{}).constructor);
        });

        it("should skip if the number of requests in progress exceeds max concurrent", async () => {
            const localQueue = new Queue();
            localQueue.setThrottlingOptions({maxConcurrentRequests: 2});

            const request = createRequest();
            (localQueue as any).mQueue["default"] = {inProgress: 3, requestPool: [request]};

            const shiftSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool, "shift");
            const dequeueSpy = jest.spyOn(localQueue as any, "dequeue");
            (localQueue as any).dequeue("default");

            expect(shiftSpy).toHaveBeenCalledTimes(0);
            expect(dequeueSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledWith("default");

            expect((localQueue as any).mQueue["default"].inProgress).toEqual(3);
            expect((localQueue as any).mQueue["default"].requestPool.length).toEqual(1);
            expect((localQueue as any).mQueue["default"].requestPool[0]).toEqual(request);
            expect((localQueue as any).mQueue["default"].requestPool[0].func).toEqual(timerPromiseResolve);
            expect((localQueue as any).mQueue["default"].requestPool[0].timeout).toBeInstanceOf(setTimeout(()=>{}).constructor);
        });

        it("should process an item on the queue - resolve", async () => {
            const localQueue = new Queue();

            const request = createRequest();
            jest.advanceTimersByTime(1);

            (localQueue as any).mQueue["default"] = {inProgress: 0, requestPool: [request]};

            const shiftSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool, "shift");
            const dequeueSpy = jest.spyOn(localQueue as any, "dequeue");
            const functionSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool[0], "func");
            const resolveSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool[0], "resolve");
            const rejectSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool[0], "reject");

            (localQueue as any).dequeue("default");

            expect(shiftSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledWith("default");
            expect(functionSpy).toHaveBeenCalledTimes(1);
            expect(resolveSpy).toHaveBeenCalledTimes(0);
            expect(rejectSpy).toHaveBeenCalledTimes(0);
            expect((localQueue as any).mQueue["default"].inProgress).toEqual(1);
            expect((localQueue as any).mQueue["default"].requestPool.length).toEqual(0);

            jest.advanceTimersByTime(5);
            jest.runAllTimers();
            let response: string;
            let error: Error;
            try {
                response = await request.promise;
            } catch (err) {
                error = err;
            }

            expect(functionSpy).toHaveBeenCalledTimes(1);
            expect(resolveSpy).toHaveBeenCalledTimes(1);
            expect(rejectSpy).toHaveBeenCalledTimes(0);
            expect(dequeueSpy).toHaveBeenCalledTimes(2);
            expect(dequeueSpy).toHaveBeenCalledWith("default");
            expect(response).toEqual("done");
            expect(error).not.toBeDefined();

            expect((localQueue as any).mQueue["default"].inProgress).toEqual(0);
            expect((localQueue as any).mQueue["default"].requestPool.length).toEqual(0);
        });

        it("should process an item on the queue - reject", async () => {
            const localQueue = new Queue();

            const request = createRequest(false);
            jest.advanceTimersByTime(1);

            (localQueue as any).mQueue["default"] = {inProgress: 0, requestPool: [request]};

            const shiftSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool, "shift");
            const dequeueSpy = jest.spyOn(localQueue as any, "dequeue");
            const functionSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool[0], "func");
            const resolveSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool[0], "resolve");
            const rejectSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool[0], "reject");

            (localQueue as any).dequeue("default");

            expect(shiftSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledWith("default");
            expect(functionSpy).toHaveBeenCalledTimes(1);
            expect(resolveSpy).toHaveBeenCalledTimes(0);
            expect(rejectSpy).toHaveBeenCalledTimes(0);
            expect((localQueue as any).mQueue["default"].inProgress).toEqual(1);
            expect((localQueue as any).mQueue["default"].requestPool.length).toEqual(0);

            jest.advanceTimersByTime(5);
            jest.runAllTimers();
            let response: string;
            let error: Error;
            try {
                response = await request.promise;
            } catch (err) {
                error = err;
            }

            expect(functionSpy).toHaveBeenCalledTimes(1);
            expect(resolveSpy).toHaveBeenCalledTimes(0);
            expect(rejectSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledTimes(2);
            expect(dequeueSpy).toHaveBeenCalledWith("default");
            expect(response).not.toEqual("done");
            expect(error).toBeInstanceOf(ImperativeError);
            expect(error.message).toEqual("done");

            expect((localQueue as any).mQueue["default"].inProgress).toEqual(0);
            expect((localQueue as any).mQueue["default"].requestPool.length).toEqual(0);
        });

        it("should skip an item that has timed out", async () => {
            const localQueue = new Queue();

            const request = createRequest();
            jest.advanceTimersByTime(2);
            jest.runAllTimers();
            (localQueue as any).mQueue["default"] = {inProgress: 0, requestPool: [request]};

            const shiftSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool, "shift");
            const dequeueSpy = jest.spyOn(localQueue as any, "dequeue");
            const functionSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool[0], "func");
            const rejectSpy = jest.spyOn((localQueue as any).mQueue["default"].requestPool[0], "reject");

            (localQueue as any).dequeue("default");

            let error: Error;
            try {
                await request.promise;
            } catch (err) {
                error = err;
            }

            expect(shiftSpy).toHaveBeenCalledTimes(1);
            expect(dequeueSpy).toHaveBeenCalledTimes(2);
            expect(dequeueSpy).toHaveBeenCalledWith("default");
            expect(functionSpy).toHaveBeenCalledTimes(0);
            expect(rejectSpy).toHaveBeenCalledTimes(1);
            expect(rejectSpy).toHaveBeenCalledWith(expect.any(ImperativeError));
            expect((rejectSpy.mock.calls[0][0] as Error).message).toContain("Request timed out while in the request queue.");
            expect(error).toBeInstanceOf(ImperativeError);
            expect(error.message).toEqual("Request timed out while in the request queue.");
            expect((localQueue as any).mQueue["default"].inProgress).toEqual(0);
            expect((localQueue as any).mQueue["default"].requestPool.length).toEqual(0);
        });
    });
});