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

import * as os from "os";
import { PassThrough, Writable } from "stream";
import { randomBytes } from "crypto";
import * as zlib from "zlib";
import * as streamToString from "stream-to-string";
import { CompressionUtils } from "../../src/client/CompressionUtils";
import { ContentEncoding } from "../../src/client/Headers";
import { ImperativeError } from "../../../error";

const responseText = "Request failed successfully";
const rawBuffer = Buffer.from(responseText);
const brBuffer = zlib.brotliCompressSync(rawBuffer);
const deflateBuffer = zlib.deflateSync(rawBuffer);
const gzipBuffer = zlib.gzipSync(rawBuffer);

describe("CompressionUtils tests", () => {
    describe("decompressBuffer", () => {
        it("should decompress buffer using Brotli algorithm", () => {
            const result = CompressionUtils.decompressBuffer(brBuffer, "br").toString();
            expect(result).toBe(responseText);
        });

        it("should decompress buffer using deflate algorithm", () => {
            const result = CompressionUtils.decompressBuffer(deflateBuffer, "deflate").toString();
            expect(result).toBe(responseText);
        });

        it("should decompress buffer using gzip algorithm", () => {
            const result = CompressionUtils.decompressBuffer(gzipBuffer, "gzip").toString();
            expect(result).toBe(responseText);
        });

        it("should fail to decompress buffer using unknown algorithm", () => {
            let caughtError;
            try {
                CompressionUtils.decompressBuffer(rawBuffer, null as any);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("Unsupported content encoding type");
        });

        it("should fail to decompress buffer with invalid data", () => {
            let caughtError;
            try {
                CompressionUtils.decompressBuffer(brBuffer, "gzip");
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("Failed to decompress response buffer");
            expect(caughtError.causeErrors).toBeDefined();
        });
    });

    describe("decompressStream", () => {
        let duplex: PassThrough;

        beforeEach(() => {
            duplex = new PassThrough();
        });

        it("should decompress stream using Brotli algorithm", async () => {
            const responseStream = CompressionUtils.decompressStream(duplex, "br");
            responseStream.end(brBuffer);
            const result = await streamToString(duplex);
            expect(result).toBe(responseText);
        });

        it("should decompress stream using deflate algorithm", async () => {
            const responseStream = CompressionUtils.decompressStream(duplex, "deflate");
            responseStream.end(deflateBuffer);
            const result = await streamToString(duplex);
            expect(result).toBe(responseText);
        });

        it("should decompress stream using gzip algorithm", async () => {
            const responseStream = CompressionUtils.decompressStream(duplex, "gzip");
            responseStream.end(gzipBuffer);
            const result = await streamToString(duplex);
            expect(result).toBe(responseText);
        });

        it("should decompress stream and normalize new lines", async () => {
            jest.spyOn(os, "platform").mockReturnValueOnce("win32");
            const responseStream = CompressionUtils.decompressStream(duplex, "gzip", true);
            const unixBuffer = Buffer.concat([rawBuffer, Buffer.from("\n")]);
            responseStream.end(zlib.gzipSync(unixBuffer));
            const result = await streamToString(duplex);
            expect(result).toBe(`${responseText}\r\n`);
        });

        it("should fail to decompress stream using unknown algorithm", () => {
            let caughtError;
            try {
                CompressionUtils.decompressStream(duplex, null as any);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("Unsupported content encoding type");
        });

        it("should fail to decompress invalid stream", async () => {
            let caughtError;
            try {
                CompressionUtils.decompressStream(null, "gzip");
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("Failed to decompress response stream");
        });

        it("should fail to decompress stream with invalid data", async () => {
            let caughtError;
            try {
                const responseStream = CompressionUtils.decompressStream(duplex, "gzip");
                responseStream.end(brBuffer);
                await streamToString(duplex);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("Failed to decompress response stream");
            expect(caughtError.causeErrors).toBeDefined();
        });
    });

    describe("decompressed output limit", () => {
        const limit = 1024;
        const encodings: [ContentEncoding, (data: Buffer) => Buffer][] = [
            ["br", zlib.brotliCompressSync],
            ["deflate", zlib.deflateSync],
            ["gzip", zlib.gzipSync]
        ];

        describe.each(encodings)("%s", (encoding, compress) => {
            describe("decompressBuffer", () => {
                it("should return the full output when it equals the limit", () => {
                    const exact = Buffer.alloc(limit, "a");
                    expect(CompressionUtils.decompressBuffer(compress(exact), encoding, limit)).toEqual(exact);
                });

                it("should fail when the output is one byte over the limit and retain the native cause", () => {
                    let caughtError;
                    try {
                        CompressionUtils.decompressBuffer(compress(Buffer.alloc(limit + 1, "a")), encoding, limit);
                    } catch (error) {
                        caughtError = error;
                    }
                    expect(caughtError).toBeInstanceOf(ImperativeError);
                    expect(caughtError.message).toContain("Failed to decompress response buffer");
                    expect(caughtError.causeErrors.code).toBe("ERR_BUFFER_TOO_LARGE");
                    expect(caughtError.additionalDetails).toContain(`limit of ${limit} bytes`);
                });
            });

            describe("decompressStream", () => {
                let destination: Writable;
                let received: Buffer[];
                let errors: Error[];
                let closed: Promise<void>;

                beforeEach(() => {
                    received = [];
                    errors = [];
                    destination = new Writable({
                        write(chunk, _, callback) {
                            received.push(chunk);
                            callback();
                        }
                    });
                    destination.on("error", (err) => errors.push(err));
                    closed = new Promise((resolve) => destination.once("close", () => resolve()));
                });

                it("should forward the full output when it equals the limit", async () => {
                    const exact = randomBytes(limit);
                    CompressionUtils.decompressStream(destination, encoding, false, limit).end(compress(exact));
                    await closed;
                    expect(errors).toEqual([]);
                    expect(Buffer.concat(received)).toEqual(exact);
                });

                it("should enforce the limit cumulatively across chunks and not forward the offending chunk", async () => {
                    // Incompressible data decodes progressively as compressed slices arrive
                    const compressed = compress(randomBytes(limit + 1));
                    const decoder = CompressionUtils.decompressStream(destination, encoding, false, limit);
                    const sliceSize = 100;
                    for (let i = 0; i < compressed.length && !decoder.destroyed; i += sliceSize) {
                        decoder.write(compressed.subarray(i, i + sliceSize));
                        await new Promise((resolve) => setImmediate(resolve));
                    }
                    await closed;

                    expect(errors).toHaveLength(1);
                    expect(errors[0]).toBeInstanceOf(ImperativeError);
                    expect(errors[0].message).toContain(`exceeds ${limit} bytes`);
                    // Earlier chunks were forwarded, but the total stays within the limit
                    const forwarded = Buffer.concat(received).length;
                    expect(forwarded).toBeGreaterThan(0);
                    expect(forwarded).toBeLessThanOrEqual(limit);
                });

                it("should destroy the decoder and destination when the limit is exceeded", async () => {
                    const decoder = CompressionUtils.decompressStream(destination, encoding, true, limit);
                    decoder.end(compress(Buffer.alloc(limit + 1, "a")));
                    await closed;

                    expect(errors).toHaveLength(1);
                    expect(errors[0]).toBeInstanceOf(ImperativeError);
                    expect(errors[0].message).toContain(`exceeds ${limit} bytes`);
                    expect(decoder.destroyed).toBe(true);
                    expect(destination.destroyed).toBe(true);
                    expect(received).toEqual([]);
                });

                it("should destroy the decoder when the destination is destroyed without an error", async () => {
                    const decoder = CompressionUtils.decompressStream(destination, encoding, true, limit);
                    // Partial input: the decoder is still waiting for the rest when the destination goes away
                    decoder.write(compress(Buffer.alloc(100, "a")).subarray(0, 5));
                    destination.destroy();
                    await closed;
                    await new Promise((resolve) => setImmediate(resolve));

                    expect(errors).toEqual([]);
                    expect(decoder.destroyed).toBe(true);
                });
            });
        });

        describe("defaults", () => {
            // 1 MiB over the buffered default, but far below the streamed default
            const bufferedDefault = 64 * 1024 * 1024;
            const compressed = zlib.gzipSync(Buffer.alloc(bufferedDefault + 1024 * 1024));

            it("should cap buffered decompression at 64 MiB when no limit is given", () => {
                expect(() => CompressionUtils.decompressBuffer(compressed, "gzip")).toThrow("Failed to decompress response buffer");
            });

            it("should allow streamed decompression beyond 64 MiB when no limit is given", async () => {
                let total = 0;
                const destination = new Writable({
                    write(chunk, _, callback) {
                        total += chunk.length;
                        callback();
                    }
                });
                const finished = new Promise<void>((resolve, reject) => destination.once("finish", resolve).once("error", reject));
                CompressionUtils.decompressStream(destination, "gzip").end(compressed);
                await finished;
                expect(total).toBe(bufferedDefault + 1024 * 1024);
            });
        });

        it.each([0, -1, 1.5, NaN, Infinity])("should reject invalid limit %p", (invalid) => {
            expect(() => CompressionUtils.decompressBuffer(gzipBuffer, "gzip", invalid)).toThrow("Invalid maxDecompressedResponseBytes");
            expect(() => CompressionUtils.decompressStream(new PassThrough(), "gzip", false, invalid))
                .toThrow("Invalid maxDecompressedResponseBytes");
        });
    });
});
