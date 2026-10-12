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

import { BufferBuilder } from "../src/BufferBuilder";
import { ImperativeError } from "../../error";

describe("BufferBuilder", () => {
    it("calls the given callback on write", () => {
        const bufBuilder = new BufferBuilder();
        const callbackMock = jest.fn();
        bufBuilder._write(new Uint8Array([1, 2, 3]), "binary", callbackMock);
        expect(callbackMock).toHaveBeenCalled();
    });

    it("calls 'push' on read", () => {
        const bufBuilder = new BufferBuilder();
        const callbackMock = jest.fn();
        const pushMock = jest.spyOn(bufBuilder, "push");
        bufBuilder._write(new Uint8Array([1, 2, 3]), "binary", callbackMock);
        bufBuilder._read(3);
        expect(pushMock).toHaveBeenCalledTimes(2);
    });

    describe("maxBytes", () => {
        it("accepts writes up to exactly the limit across several chunks", () => {
            const bufBuilder = new BufferBuilder(6);
            const callbackMock = jest.fn();
            bufBuilder._write(Buffer.from([1, 2, 3]), "binary", callbackMock);
            bufBuilder._write(Buffer.from([4, 5, 6]), "binary", callbackMock);
            expect(callbackMock).toHaveBeenCalledTimes(2);
            expect(callbackMock).toHaveBeenNthCalledWith(1);
            expect(callbackMock).toHaveBeenNthCalledWith(2);
            expect(bufBuilder.read()).toEqual(Buffer.from([1, 2, 3, 4, 5, 6]));
        });

        it("fails the write that crosses the limit and drops what was collected", () => {
            const bufBuilder = new BufferBuilder(6);
            const callbackMock = jest.fn();
            bufBuilder._write(Buffer.from([1, 2, 3, 4]), "binary", jest.fn());
            bufBuilder._write(Buffer.from([5, 6, 7]), "binary", callbackMock);
            expect(callbackMock).toHaveBeenCalledWith(expect.any(ImperativeError));
            expect(callbackMock.mock.calls[0][0].message).toContain("exceeds the maximum of 6 bytes");
            expect((bufBuilder as any).chunks).toEqual([]);
        });

        it("fails a single chunk larger than the limit", () => {
            const callbackMock = jest.fn();
            new BufferBuilder(2)._write(Buffer.from([1, 2, 3]), "binary", callbackMock);
            expect(callbackMock).toHaveBeenCalledWith(expect.any(ImperativeError));
        });

        it.each([0, -1, 1.5, NaN, Infinity])("rejects invalid limit %p", (invalid) => {
            expect(() => new BufferBuilder(invalid)).toThrow("Invalid maxBytes");
        });
    });
});
