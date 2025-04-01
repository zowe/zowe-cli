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

import { Utilities, ZosFilesMessages, Tag, ZosFilesConstants, IOptions } from "../../../../src";
import { Session, Headers } from "@zowe/imperative";
import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { posix } from "path";

interface IChtagArgs {
    type: Tag;
    codeset?: string;
}

describe("Utilities", () => {
    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    const payload = { request: "chtag", action: "list" };
    const filename = "/u/myhlq/aFile.txt";
    const content = Buffer.from(JSON.stringify({ stdout: ["m ISO8859-1   T=off /tmp/file"] }));

    // Declare shared variables for response and error.
    let response: any;
    let error: any;

    beforeEach(() => {
        response = undefined;
        error = undefined;
    });

    describe("chtag", () => {
        it("should throw an error if filename is missing", async () => {
            try {
                response = await Utilities.chtag(dummySession, undefined, undefined);
            } catch (err) {
                error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should throw an error if codeset is specified with Tag.BINARY", async () => {
            try {
                response = await Utilities.chtag(dummySession, "/testfile", Tag.BINARY, "ISO8859-1");
            } catch (err) {
                error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toContain("A codeset cannot be specified for a binary file.");
        });

        it("should make a REST request to set the tag to binary", async () => {
            let caughtError: any;
            try {
                await testChtagExpectPayload({ type: Tag.BINARY }, { request: "chtag", action: "set", type: "binary" });
            } catch (err) {
                caughtError = err;
            }
            expect(caughtError).toBeUndefined();
        });

        it("should make a REST request to set the tag to text", async () => {
            let caughtError: any;
            try {
                await testChtagExpectPayload({ type: Tag.TEXT }, { request: "chtag", action: "set", type: "text" });
            } catch (err) {
                caughtError = err;
            }
            expect(caughtError).toBeUndefined();
        });

        it("should make a REST request to set the tag with a codeset", async () => {
            let caughtError: any;
            try {
                await testChtagExpectPayload(
                    { type: Tag.TEXT, codeset: "ISO8859-1" },
                    { request: "chtag", action: "set", type: "text", codeset: "ISO8859-1" }
                );
            } catch (err) {
                caughtError = err;
            }
            expect(caughtError).toBeUndefined();
        });

        it("should URI-encode the path", async () => {
            const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockResolvedValue(Buffer.from(""));
            response = await Utilities.chtag(dummySession, "/test file", Tag.TEXT, "ISO8859-1");
            expect(response.success).toBeTruthy();
            const expectedUrl = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + "/test%20file";
            expect(restClientSpy).toHaveBeenCalledWith(dummySession, expectedUrl, expect.anything(), expect.anything());
        });

        async function testChtagExpectPayload(args: IChtagArgs, expectedPayload: any) {
            const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockResolvedValue(Buffer.from(""));
            response = await Utilities.chtag(dummySession, "/testfile", args.type, args.codeset);
            expect(response.success).toBeTruthy();
            const expectedUrl = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + "/testfile";
            expect(restClientSpy).toHaveBeenCalledWith(
                dummySession,
                expectedUrl,
                [
                    Headers.APPLICATION_JSON,
                    { [Headers.CONTENT_LENGTH]: JSON.stringify(expectedPayload).length.toString() },
                    ZosmfHeaders.ACCEPT_ENCODING
                ],
                expectedPayload
            );
        }
    });

    describe("Utilities.putUSSPayload", () => {
        const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer");

        beforeEach(() => {
            zosmfExpectSecondSpy.mockClear();
            zosmfExpectSecondSpy.mockImplementation(async () => content);
        });

        it("should include X-IBM-Response-Timeout header when responseTimeout is provided", async () => {
            // Use a value greater than 5 (e.g. 6) so that the header is added.
            const responseTimeout = 6;
            const testPayload = { request: "test", action: "doSomething" };
            const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockResolvedValue(Buffer.from("dummy"));
            await Utilities.putUSSPayload(dummySession, "/u/testfile", testPayload, responseTimeout);
            const reqHeaders = restClientSpy.mock.calls[0][2];
            const timeoutHeader = reqHeaders.find((h: any) =>
                Object.keys(h).includes(ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT)
            );
            expect(timeoutHeader).toBeDefined();
            expect(timeoutHeader[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]).toEqual(responseTimeout.toString());
        });

        it("should throw an error if the uss file name is null", async () => {
            try {
                response = await Utilities.putUSSPayload(dummySession, null, payload);
            } catch (e) {
                error = e;
            }
            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should throw an error if the uss file name is not defined", async () => {
            try {
                response = await Utilities.putUSSPayload(dummySession, undefined, payload);
            } catch (e) {
                error = e;
            }
            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should throw an error if the payload is null", async () => {
            try {
                response = await Utilities.putUSSPayload(dummySession, filename, null);
            } catch (e) {
                error = e;
            }
            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingPayload.message);
        });

        it("should throw an error if the payload is not defined", async () => {
            try {
                response = await Utilities.putUSSPayload(dummySession, filename, undefined);
            } catch (e) {
                error = e;
            }
            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingPayload.message);
        });

        it("should get chtag response", async () => {
            try {
                response = await Utilities.putUSSPayload(dummySession, filename, payload);
            } catch (e) {
                error = e;
            }
            const endpoint = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_USS_FILES,
                encodeURIComponent(filename.substring(1))
            );
            expect(error).toBeUndefined();
            expect(response).toEqual(content);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(
                dummySession,
                endpoint,
                [
                    { "Content-Type": "application/json" },
                    { "Content-Length": JSON.stringify(payload).length.toString() },
                    ZosmfHeaders.ACCEPT_ENCODING
                ],
                payload
            );
        });
    });

    describe("isFileTagBinOrAscii changing content", () => {
        const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer");
        it("should get a positive indication to UTF-8", async () => {
            zosmfExpectSecondSpy.mockClear();
            const content1 = Buffer.from(JSON.stringify({ stdout: ["m UTF-8   T=off /tmp/file"] }));
            zosmfExpectSecondSpy.mockImplementation(async () => content1);
            try {
                response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
            } catch (e) {
                error = e;
            }
            const endpoint = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_USS_FILES,
                encodeURIComponent(filename.substring(1))
            );
            expect(error).toBeUndefined();
            expect(response).toEqual(true);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(
                dummySession,
                endpoint,
                [
                    { "Content-Type": "application/json" },
                    { "Content-Length": JSON.stringify(payload).length.toString() },
                    ZosmfHeaders.ACCEPT_ENCODING
                ],
                payload
            );
        });
    });

    describe("applyTaggedEncoding", () => {
        const localDummySession = new Session({
            user: "fake",
            password: "fake",
            hostname: "fake",
            port: 443,
            protocol: "https",
            type: "basic"
        });
        const ussname = "/u/zowe/test";
        it("should pass responseTimeout to putUSSPayload", async () => {
            // Use a value greater than 5 so that the header is added.
            const responseTimeout = 6;
            const simulatedResponse = Buffer.from(JSON.stringify({ stdout: ["b binary T=on /u/testfile"] }));
            const spy = jest.spyOn(Utilities, "putUSSPayload").mockResolvedValue(simulatedResponse);
            const options: IOptions = {};
            await Utilities.applyTaggedEncoding(localDummySession, "/u/testfile", options, responseTimeout);
            expect(options.binary).toEqual(true);
            expect(spy).toHaveBeenCalledWith(
                localDummySession,
                "/u/testfile",
                expect.any(Object),
                responseTimeout
            );
        });
        it("should set binary property if file is tagged as binary", async () => {
            jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(
                Buffer.from(JSON.stringify({ stdout: ["b binary\tT=off\t" + ussname] }))
            );
            const options: IOptions = {};
            await Utilities.applyTaggedEncoding(dummySession, ussname, options);
            expect(options.binary).toBe(true);
            expect(options.encoding).toBeUndefined();
        });
        it("should set binary property if file encoding is ISO8859-1", async () => {
            jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(
                Buffer.from(JSON.stringify({ stdout: ["t ISO8859-1\tT=on\t" + ussname] }))
            );
            const options: IOptions = {};
            await Utilities.applyTaggedEncoding(dummySession, ussname, options);
            expect(options.binary).toBe(true);
            expect(options.encoding).toBeUndefined();
        });
        it("should set binary property if file encoding is UCS-2", async () => {
            jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(
                Buffer.from(JSON.stringify({ stdout: ["t UCS-2\tT=on\t" + ussname] }))
            );
            const options: IOptions = {};
            await Utilities.applyTaggedEncoding(dummySession, ussname, options);
            expect(options.binary).toBe(true);
            expect(options.encoding).toBeUndefined();
        });
        it("should set binary property if file encoding is UTF-8", async () => {
            jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(
                Buffer.from(JSON.stringify({ stdout: ["t UTF-8\tT=on\t" + ussname] }))
            );
            const options: IOptions = {};
            await Utilities.applyTaggedEncoding(dummySession, ussname, options);
            expect(options.binary).toBe(true);
            expect(options.encoding).toBeUndefined();
        });
        it("should set encoding property if file encoding has IBM prefix", async () => {
            jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(
                Buffer.from(JSON.stringify({ stdout: ["t IBM-1047\tT=on\t" + ussname] }))
            );
            const options: IOptions = {};
            await Utilities.applyTaggedEncoding(dummySession, ussname, options);
            expect(options.binary).toBeUndefined();
            expect(options.encoding).toBe("IBM-1047");
        });
        it("should do nothing if file is untagged", async () => {
            jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(
                Buffer.from(JSON.stringify({ stdout: ["- untagged\tT=off\t" + ussname] }))
            );
            const options: IOptions = {};
            await Utilities.applyTaggedEncoding(dummySession, ussname, options);
            expect(options.binary).toBeUndefined();
            expect(options.encoding).toBeUndefined();
        });
    });

    describe("renameUSSFile", () => {
        const localDummySession = new Session({
            user: "fake",
            password: "fake",
            hostname: "fake",
            port: 443,
            protocol: "https",
            type: "basic"
        });
        it("should fail if new file path is not passed in", async () => {
            try {
                await Utilities.renameUSSFile(localDummySession, "/u/zowe/test", undefined);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });
        it("should execute if all parameters are provided", async () => {
            // Ensure that putUSSPayload returns a dummy Buffer so that renameUSSFile returns a Buffer.
            jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockResolvedValue(Buffer.from("dummyBuffer"));
            const zosmfExpectSpy = jest.spyOn(Utilities, "putUSSPayload").mockResolvedValue(Buffer.from("dummyBuffer"));
            const oldPath = "/u/zowe/test";
            const newPath = "/u/zowe/test1";
            const rto: any = undefined;
            try {
                response = await Utilities.renameUSSFile(localDummySession, oldPath, newPath);
            } catch (e) {
                error = e;
            }
            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(Buffer.isBuffer(response)).toBeTruthy();
            expect(response.toString()).toEqual("dummyBuffer");
            const payloadRename = { request: "move", from: oldPath };
            expect(zosmfExpectSpy).toHaveBeenLastCalledWith(localDummySession, newPath, payloadRename, rto);
        });
        it("should pass responseTimeout to putUSSPayload", async () => {
            const responseTimeout = 6;
            const spy = jest.spyOn(Utilities, "putUSSPayload").mockResolvedValue(Buffer.from("dummy"));
            const oldPath = "/u/old";
            const newPath = "/u/new";
            await Utilities.renameUSSFile(localDummySession, oldPath, newPath, responseTimeout);
            expect(spy).toHaveBeenCalledWith(
                localDummySession,
                newPath,
                expect.any(Object),
                responseTimeout
            );
        });
    });

    describe("Utilities.chtag", () => {
        it("should pass responseTimeout to putUSSPayload", async () => {
            const responseTimeout = 6;
            const spy = jest.spyOn(Utilities, "putUSSPayload").mockResolvedValue(Buffer.from("dummy"));
            await Utilities.chtag(dummySession, "/u/testfile", Tag.TEXT, "IBM-1047", responseTimeout);
            expect(spy).toHaveBeenCalledWith(
                dummySession,
                "/u/testfile",
                expect.any(Object),
                responseTimeout
            );
        });
    });
});