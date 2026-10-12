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
import * as https from "https";
import * as os from "os";
import { join } from "path";
import * as zlib from "zlib";
import { Session } from "@zowe/imperative";
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
        jest.spyOn(https, "request").mockImplementation(((_options: any, callback: (res: any) => void) => {
            const request: any = new EventEmitter();
            Object.assign(request, { reusedSocket: false, socket: {}, write: jest.fn(), end: jest.fn(), setTimeout: jest.fn(), destroy: jest.fn() });
            process.nextTick(() => {
                const response: any = new EventEmitter();
                Object.assign(response, { headers, statusCode, pause: jest.fn(), resume: jest.fn(), destroy: jest.fn() });
                callback(response);
                response.emit("data", body);
                response.emit("end");
            });
            return request;
        }) as any);
    };

    const downloads: [string, (options: object) => Promise<unknown>][] = [
        ["dataSet", (options) => Download.dataSet(session, "USER.PDS(MEM1)", { file: join(tmpDir, "mem1.txt"), ...options })],
        ["allMembers", (options) => Download.allMembers(session, "USER.PDS", { directory: tmpDir, ...options })],
        ["allDataSets", (options) => Download.allDataSets(session, [{ dsname: "USER.PDS", dsorg: "PO" }] as any, { directory: tmpDir, ...options })]
    ];

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(join(os.tmpdir(), "zosfiles-limits-"));
        jest.spyOn(List, "allMembers").mockResolvedValue({ apiResponse: { items: [{ member: "MEM1" }] } } as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    describe.each(downloads)("%s", (_name, download) => {
        // Content of everything that was written below the temp directory, whichever layout the API uses
        const downloadedContent = () => Buffer.concat(
            (fs.readdirSync(tmpDir, { recursive: true, withFileTypes: true }))
                .filter((entry) => entry.isFile())
                .map((entry) => fs.readFileSync(join(entry.parentPath, entry.name)))
        );

        it("should write the full member when its decompressed size is exactly maxDecompressedResponseBytes", async () => {
            const content = Buffer.alloc(limit, "a");
            serve(zlib.gzipSync(content), { "content-encoding": "gzip" });

            await download({ maxDecompressedResponseBytes: limit });

            expect(downloadedContent()).toEqual(content);
        });

        it("should reject and not leave a file when the decompressed size is one byte over maxDecompressedResponseBytes", async () => {
            serve(zlib.gzipSync(Buffer.alloc(limit + 1, "a")), { "content-encoding": "gzip" });

            await expect(download({ maxDecompressedResponseBytes: limit })).rejects.toThrow();

            expect(downloadedContent().length).toBeLessThanOrEqual(limit);
        });

        it("should enforce maxBufferedResponseBytes on a buffered HTTP error body", async () => {
            serve(Buffer.alloc(11, "e"), {}, 500);

            let error: Error;
            try {
                await download({ maxBufferedResponseBytes: 10 });
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(JSON.stringify([error.message, (error as any).causeErrors, (error as any).additionalDetails]))
                .toContain("maximum buffered size of 10 bytes");
        });
    });
});
