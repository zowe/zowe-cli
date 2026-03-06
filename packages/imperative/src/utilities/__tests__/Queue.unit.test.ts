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
import { Queue } from "../src/queue";

describe("Queue", () => {
    beforeAll(() => {
        // Disable timeouts for the tests.
        jest.useFakeTimers();
    });

    it("should initialize with the proper defaults", () => {
        const queue = new Queue();

        expect((queue as any).mQueueTimeout).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
        expect((queue as any).mMaxConcurrentRequests).toEqual(Constants.MAX_SIGNED_32BIT_NUMBER);
        expect((queue as any).mQueue).toEqual({"default": {inProgress: 0, requestPool: []}});
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
});