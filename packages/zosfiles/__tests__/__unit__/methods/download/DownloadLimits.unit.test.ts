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

import { EventEmitter } from "events";
import * as fs from "fs";
import { ClientRequest, IncomingMessage } from "http";
import * as https from "https";
import * as os from "os";
import { join } from "path";
import * as zlib from "zlib";
import { ImperativeError, Session } from "@zowe/imperative";
import { Download } from "../../../../src/methods/download/Download";
import { List } from "../../../../src/methods/list";

/**
 * These tests do not mock the REST client: a fake https response is served to the real
 * ZosmfRestClient so that the response limits are enforced for real.
 */
describe("z/OS Files - Download response limits", () => {
    const limit = 1024;
    const session = new Session({ user: "fake", password: "fake", hostname: "fake", port: 443, protocol: "https", type: "basic" });
    let tmpDir: string;

    const serve = (body: Buffer, headers: { [key: string]: string }, statusCode = 200) => {
        // The REST client only needs these request/response members from the HTTP test doubles.
        const request = Object.assign(new EventEmitter(), {
            reusedSocket: false, socket: {}, write: jest.fn(), end: jest.fn(), setTimeout: jest.fn(), destroy: jest.fn()
        }) as unknown as ClientRequest;
        const response = Object.assign(new EventEmitter(), {
            headers, statusCode, pause: jest.fn(), resume: jest.fn(), destroy: jest.fn()
        }) as unknown as IncomingMessage;
        // This fake handles the options/callback overload used by the REST client, not every HTTPS overload.
        const fakeRequest = ((_options: https.RequestOptions, callback: (res: IncomingMessage) => void) => {
            process.nextTick(() => {
                callback(response);
                response.emit("data", body);
                response.emit("end");
            });
            return request;
        }) as unknown as typeof https.request;
        jest.spyOn(https, "request").mockImplementation(fakeRequest);
    };

    const downloads: [string, (options: object) => Promise<unknown>][] = [
        ["dataSet", (options) => Download.dataSet(session, "USER.PDS(MEM1)", { file: join(tmpDir, "mem1.txt"), ...options })],
        ["allMembers", (options) => Download.allMembers(session, "USER.PDS", { directory: tmpDir, ...options })],
        ["allDataSets", (options) => Download.allDataSets(session, [{ dsname: "USER.PDS", dsorg: "PO", vol: "VOL001" }],
            { directory: tmpDir, ...options })]
    ];

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(join(os.tmpdir(), "zosfiles-limits-"));
        jest.spyOn(List, "allMembers").mockResolvedValue({
            success: true, commandResponse: "", apiResponse: { items: [{ member: "MEM1" }] }
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    describe.each(downloads)("%s", (_name, download) => {
        // Content of everything that was written below the temp directory, whichever layout the API uses
        const readDownloadedFiles = (directory: string): Buffer[] => fs.readdirSync(directory, { withFileTypes: true })
            .flatMap((entry) => {
                const path = join(directory, entry.name);
                return entry.isDirectory() ? readDownloadedFiles(path) : [fs.readFileSync(path)];
            });
        const downloadedContent = () => Buffer.concat(readDownloadedFiles(tmpDir));

        it("should write the full member when its decompressed size is exactly maxDecompressedResponseBytes", async () => {
            const content = Buffer.alloc(limit, "a");
            serve(zlib.gzipSync(content), { "content-encoding": "gzip" });

            await download({ maxDecompressedResponseBytes: limit });

            expect(downloadedContent()).toEqual(content);
        });

        it("should reject and never write more than the limit when decompressed content is one byte over", async () => {
            serve(zlib.gzipSync(Buffer.alloc(limit + 1, "a")), { "content-encoding": "gzip" });

            await expect(download({ maxDecompressedResponseBytes: limit })).rejects.toThrow();

            expect(downloadedContent().length).toBeLessThanOrEqual(limit);
        });

        it("should enforce maxBufferedResponseBytes on a buffered HTTP error body", async () => {
            serve(Buffer.alloc(11, "e"), {}, 500);

            let error: unknown;
            try {
                await download({ maxBufferedResponseBytes: 10 });
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(ImperativeError);
            if (!(error instanceof ImperativeError)) {
                throw new Error("Expected the buffered response limit to fail the download");
            }
            expect(JSON.stringify([error.message, error.causeErrors, error.additionalDetails]))
                .toContain("maximum buffered size of 10 bytes");
        });
    });
});
