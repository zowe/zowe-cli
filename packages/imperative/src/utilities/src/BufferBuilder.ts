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

import { Duplex } from "stream";
import { ImperativeError } from "../../error";

/**
 * Writable stream that collects everything written to it in memory and gives it back as
 * one buffer when read.
 */
export class BufferBuilder extends Duplex {
    private chunks: Uint8Array[];
    private bytesBuffered = 0;
    private readonly maxBytes: number | undefined;

    /**
     * @param maxBytes Optional maximum number of bytes that may be collected. Writing past it
     *                 fails the stream with an ImperativeError instead of growing without bound.
     *                 Must be a positive safe integer.
     * @throws {ImperativeError} If maxBytes is not a positive safe integer
     */
    public constructor(maxBytes?: number) {
        super();
        if (maxBytes !== undefined && (!Number.isSafeInteger(maxBytes) || maxBytes <= 0)) {
            throw new ImperativeError({ msg: `Invalid maxBytes: ${String(maxBytes)}. The value must be a positive integer.` });
        }
        this.maxBytes = maxBytes;
        this.chunks = [];
    }

    public _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error) => void): void {
        if (this.maxBytes !== undefined && chunk.byteLength > this.maxBytes - this.bytesBuffered) {
            this.chunks = [];
            callback(new ImperativeError({
                msg: `Buffered data exceeds the maximum of ${this.maxBytes} bytes`,
                additionalDetails: "Download the content to a file instead of viewing it."
            }));
            return;
        }
        this.bytesBuffered += chunk.byteLength;
        this.chunks.push(chunk);
        callback();
    }

    public _read(_size: number): void {
        const concatBuf = Buffer.concat(this.chunks);
        this.push(concatBuf);
        this.push(null);
    }
}
