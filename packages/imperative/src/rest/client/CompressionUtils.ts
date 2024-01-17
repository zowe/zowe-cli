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

import { Duplex, Transform, Writable } from "stream";
import * as zlib from "zlib";
import { ImperativeError } from "../../error";
import { IO } from "../../io";
import { ContentEncoding, Headers } from "./Headers";

export class CompressionUtils {
    /**
     * Decompress a buffer using the specified algorithm.
     * @param data Compressed buffer
     * @param encoding Value of Content-Encoding header
     * @throws {ImperativeError}
     */
    public static decompressBuffer(data: Buffer, encoding: ContentEncoding): Buffer {
        if (!Headers.CONTENT_ENCODING_TYPES.includes(encoding)) {
            throw new ImperativeError({ msg: `Unsupported content encoding type ${encoding}` });
        }

        try {
            switch (encoding) {
                case "br":      return zlib.brotliDecompressSync(data);
                case "deflate": return zlib.inflateSync(data);
                case "gzip":    return zlib.gunzipSync(data);
            }
        } catch (err) {
            throw this.decompressError(err, "buffer", encoding);
        }
    }

    /**
     * Add zlib decompression transform to a Writable stream. Any compressed
     * data written to the returned stream will be decompressed using the
     * specified algorithm.
     *
     * The returned stream should only be used internally by a REST client to
     * write to. Use the original stream to read back the decompressed output
     * and handle decompression errors.
     * @param responseStream Writable stream that will receive compressed data
     * @param encoding Value of Content-Encoding header
     * @param normalizeNewLines Specifies if line endings should be converted
     * @throws {ImperativeError}
     */
    public static decompressStream(responseStream: Writable, encoding: ContentEncoding, normalizeNewLines?: boolean): Duplex {
        if (!Headers.CONTENT_ENCODING_TYPES.includes(encoding)) {
            throw new ImperativeError({ msg: `Unsupported content encoding type ${encoding}` });
        }

        try {
            // First transform handles decompression
            const transforms = [this.zlibTransform(encoding, !normalizeNewLines)];

            // Second transform is optional and processes line endings
            if (normalizeNewLines) {
                transforms.push(this.newLinesTransform());
            }

            // Chain transforms and response stream together
            for (const [i, stream] of transforms.entries()) {
                const next = transforms[i + 1] || responseStream;
                stream.pipe(next);
                stream.on("error", (err) => {
                    responseStream.emit("error", this.decompressError(err, "stream", encoding));
                });
            }

            // Return first stream in chain
            return transforms[0];
        } catch (err) {
            throw this.decompressError(err, "stream", encoding);
        }
    }

    /**
     * Return ImperativeError populated with details of decompression error
     * @param err Thrown error object
     * @param source Type of object being decompressed
     * @param encoding Value of Content-Encoding header
     */
    private static decompressError(err: Error, source: "buffer" | "stream", encoding: ContentEncoding): ImperativeError {
        return new ImperativeError({
            msg: `Failed to decompress response ${source} with content encoding type ${encoding}`,
            additionalDetails: err.message,
            causeErrors: err
        });
    }

    /**
     * Return a transform to normalize line endings in response text.
     */
    private static newLinesTransform(): Transform {
        let lastByteReceived: number = 0;
        return new Transform({
            transform(chunk, _, callback) {
                this.push(Buffer.from(IO.processNewlines(chunk.toString(), lastByteReceived)));
                lastByteReceived = chunk[chunk.byteLength - 1];
                callback();
            }
        });
    }

    /**
     * Return zlib transform for the specified decompression algorithm.
     * @param encoding Value of Content-Encoding header
     */
    private static zlibTransform(encoding: ContentEncoding, binary: boolean): Transform {
        const opts: zlib.ZlibOptions = {};
        if (binary) {
            // Handle binary data that may be truncated or missing the GZIP end of file sequence.
            // See https://nodejs.org/api/zlib.html#compressing-http-requests-and-responses
            opts.finishFlush = encoding === "br" ? zlib.constants.BROTLI_OPERATION_FLUSH : zlib.constants.Z_SYNC_FLUSH;
        }
        switch (encoding) {
            case "br":      return zlib.createBrotliDecompress(opts);
            case "deflate": return zlib.createInflate(opts);
            case "gzip":    return zlib.createGunzip(opts);
        }
    }
}
