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

import { finished, Transform, Writable } from "stream";
import * as zlib from "zlib";
import { ImperativeError } from "../../../error";
import { IO } from "../../../io";
import { ContentEncoding, Headers } from "./Headers";
import { RestConstants } from "./RestConstants";

export class CompressionUtils {
    /**
     * Validate an optional byte limit and apply its default.
     * @param value Caller-supplied limit, or undefined to use the default
     * @param defaultValue Limit to use when value is undefined
     * @param name Option name used in the error message
     * @returns The limit to enforce
     * @throws {ImperativeError} If value is not a positive safe integer
     */
    public static resolveLimit<T extends number | undefined>(value: number | undefined, defaultValue: T, name: string): number | T {
        if (value === undefined) {
            return defaultValue;
        }
        if (!Number.isSafeInteger(value) || value <= 0) {
            throw new ImperativeError({ msg: `Invalid ${name}: ${String(value)}. The value must be a positive integer.` });
        }
        return value;
    }

    /**
     * Decompress a buffer using the specified algorithm.
     * @param data Compressed buffer
     * @param encoding Value of Content-Encoding header
     * @param maxDecompressedBytes Maximum number of bytes that decompression may produce.
     *                             Defaults to RestConstants.DEFAULT_MAX_BUFFERED_DECOMPRESSED_RESPONSE_BYTES.
     * @throws {ImperativeError}
     */
    public static decompressBuffer(data: Buffer, encoding: ContentEncoding,
        maxDecompressedBytes?: number): Buffer {
        if (!Headers.CONTENT_ENCODING_TYPES.includes(encoding)) {
            throw new ImperativeError({ msg: `Unsupported content encoding type ${encoding}` });
        }

        const maxBytes = this.resolveLimit(maxDecompressedBytes, RestConstants.DEFAULT_MAX_BUFFERED_DECOMPRESSED_RESPONSE_BYTES,
            "maxDecompressedResponseBytes");
        const options = { maxOutputLength: maxBytes };

        try {
            switch (encoding) {
                case "br":      return zlib.brotliDecompressSync(data, options);
                case "deflate": return zlib.inflateSync(data, options);
                case "gzip":    return zlib.gunzipSync(data, options);
            }
        } catch (err) {
            throw this.decompressError(err, "buffer", encoding, maxBytes);
        }
    }

    /**
     * Add zlib decompression transform to a Writable stream. Any compressed
     * data written to the returned stream will be decompressed using the
     * specified algorithm.
     *
     * The decoder is followed by an output-byte limiter and, optionally, a
     * newline normalizer. If decompression fails or the limit is exceeded, every
     * stream in the chain (including responseStream) is destroyed and
     * responseStream emits an ImperativeError. Output already written to
     * responseStream at that point is incomplete.
     *
     * The returned stream should only be used internally by a REST client to
     * write to. Use the original stream to read back the decompressed output
     * and handle decompression errors.
     * @param responseStream Writable stream that will receive compressed data
     * @param encoding Value of Content-Encoding header
     * @param normalizeNewLines Specifies if line endings should be converted
     * @param maxDecompressedBytes Maximum cumulative number of bytes that decompression may produce.
     *                             Defaults to RestConstants.DEFAULT_MAX_STREAMED_DECOMPRESSED_RESPONSE_BYTES.
     * @throws {ImperativeError}
     */
    public static decompressStream(responseStream: Writable, encoding: ContentEncoding, normalizeNewLines?: boolean,
        maxDecompressedBytes?: number): Writable {
        if (!Headers.CONTENT_ENCODING_TYPES.includes(encoding)) {
            throw new ImperativeError({ msg: `Unsupported content encoding type ${encoding}` });
        }

        const maxBytes = this.resolveLimit(maxDecompressedBytes, RestConstants.DEFAULT_MAX_STREAMED_DECOMPRESSED_RESPONSE_BYTES,
            "maxDecompressedResponseBytes");

        const transforms: Transform[] = [];
        try {
            // First transform handles decompression, second caps total output
            transforms.push(this.zlibTransform(encoding, !normalizeNewLines), this.limitOutput(maxBytes));

            // Third transform is optional and processes line endings
            if (normalizeNewLines) {
                transforms.push(this.newLinesTransform());
            }

            // Tear down the whole chain exactly once
            let failed = false;
            const fail = (err: Error, destroyDestination: boolean) => {
                if (failed) {
                    return;
                }
                failed = true;
                for (const transform of transforms) {
                    transform.unpipe();
                    transform.destroy();
                }
                if (destroyDestination) {
                    responseStream.destroy(err instanceof ImperativeError ? err : this.decompressError(err, "stream", encoding));
                }
            };

            // Chain transforms and response stream together
            for (const [i, stream] of transforms.entries()) {
                stream.pipe(transforms[i + 1] || responseStream);
                stream.on("error", (err) => fail(err, true));
            }
            // Also tear the decoders down if the destination fails or is closed before it finished writing
            finished(responseStream, { readable: false }, (err?: Error | null) => {
                if (err != null) {
                    fail(err, false);
                }
            });

            // If the decoder is destroyed before it finished (e.g. by the REST client), destroy the rest
            transforms[0].once("close", () => {
                if (!transforms[0].readableEnded) {
                    fail(new ImperativeError({ msg: "Decompression stream was closed before completion" }), true);
                }
            });

            // Return first stream in chain
            return transforms[0];
        } catch (err) {
            transforms.forEach((transform) => transform.destroy());
            throw this.decompressError(err, "stream", encoding);
        }
    }

    /**
     * Return ImperativeError populated with details of decompression error
     * @param err Thrown error object
     * @param source Type of object being decompressed
     * @param encoding Value of Content-Encoding header
     * @param maxBytes Output limit that was in effect, reported if it was exceeded
     */
    private static decompressError(err: Error, source: "buffer" | "stream", encoding: ContentEncoding, maxBytes?: number): ImperativeError {
        let details = err.message;
        if (maxBytes != null && (err as NodeJS.ErrnoException).code === "ERR_BUFFER_TOO_LARGE") {
            details += `. Decompressed output exceeds the limit of ${maxBytes} bytes. ` +
                "Download the content to a file instead of viewing it.";
        }
        return new ImperativeError({
            msg: `Failed to decompress response ${source} with content encoding type ${encoding}`,
            additionalDetails: details,
            causeErrors: err
        });
    }

    /**
     * Return a transform that fails once the cumulative number of bytes passing
     * through it exceeds the limit. The chunk that crosses the limit is not forwarded.
     * @param maxBytes Maximum cumulative number of bytes
     */
    private static limitOutput(maxBytes: number): Transform {
        let totalBytes = 0;
        return new Transform({
            transform(chunk: Buffer, _, callback) {
                if (chunk.byteLength > maxBytes - totalBytes) {
                    callback(new ImperativeError({
                        msg: `Decompressed response exceeds ${maxBytes} bytes`
                    }));
                    return;
                }
                totalBytes += chunk.byteLength;
                callback(null, chunk);
            }
        });
    }

    /**
     * Return a transform to normalize line endings in response text.
     */
    private static newLinesTransform(): Transform {
        let lastByteReceived: number = 0;
        return new Transform({
            transform(chunk, _, callback) {
                this.push(IO.processNewlines(chunk, lastByteReceived));
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
