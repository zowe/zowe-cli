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

import { Utilities, IZosFilesResponse, ZosFilesMessages, Tag, ZosFilesConstants, IOptions } from "../../../../src";
import { Session, Headers } from "@zowe/imperative";
import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { posix } from "path";

interface IChtagArgs {
    type: Tag;
    codeset?: string;
}

describe("USS utiliites", () => {
    let error: Error;
    let response: IZosFilesResponse;
    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    beforeEach(() => {
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
            let caughtError;
            try {
                await testChtagExpectPayload({type: Tag.BINARY}, { request: "chtag", action: "set", type: "binary"});
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
        });

        it("should make a REST request to set the tag to text", async () => {
            let caughtError;
            try {
                await testChtagExpectPayload({type: Tag.TEXT}, { request: "chtag", action: "set", type: "text"});
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
        });

        it("should make a REST request to set the tag with a codeset", async () => {
            let caughtError;
            try {
                await testChtagExpectPayload({type: Tag.TEXT, codeset: "ISO8859-1"},
                    {request: "chtag", action: "set", type: "text", codeset: "ISO8859-1"});
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
        });

        it("should URI-encoded the path", async () => {
            const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockResolvedValue(Buffer.from(""));

            response = await Utilities.chtag(dummySession,"/test file",Tag.TEXT,"ISO8859-1");

            expect(response.success).toBeTruthy();
            const expectedUrl = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + "/test%20file";
            expect(restClientSpy).toHaveBeenCalledWith(dummySession, expectedUrl, expect.anything(),
                expect.anything());
        });

        async function testChtagExpectPayload(args: IChtagArgs, expectedPayload: any) {
            const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockResolvedValue(Buffer.from(""));

            response = await Utilities.chtag(dummySession,"/testfile",args.type,args.codeset);

            expect(response.success).toBeTruthy();
            const expectedUrl = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + "/testfile";
            expect(restClientSpy).toHaveBeenCalledWith(dummySession, expectedUrl,
                [Headers.APPLICATION_JSON, { [Headers.CONTENT_LENGTH]: JSON.stringify(expectedPayload).length.toString() },
                    ZosmfHeaders.ACCEPT_ENCODING],
                expectedPayload);
        }
    });

    describe("Utilities.putUSSPayload", () => {

        const dummySession = new Session({
            user: "fake",
            password: "fake",
            hostname: "fake",
            port: 443,
            protocol: "https",
            type: "basic"
        });

        const payload = {request:"chtag", action:"list"};
        const filename = "/u/myhlq/aFile.txt";
        const content = Buffer.from(JSON.stringify({stdout:["m ISO8859-1   T=off /tmp/file"]}));

        describe("putUSSPayload", () => {
            const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer");

            beforeEach(() => {
                zosmfExpectSecondSpy.mockClear();
                zosmfExpectSecondSpy.mockImplementation(async () => content);
            });

            it("should include X-IBM-Response-Timeout header when responseTimeout is provided", async () => {
                const responseTimeout = 5;
                const payload = { request: "test", action: "doSomething" };
                // Spy on the underlying REST client call.
                const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer")
                    .mockResolvedValue(Buffer.from("dummy"));

                await Utilities.putUSSPayload(dummySession, "/u/testfile", payload, responseTimeout);

                // The third parameter in the call should be reqHeaders.
                const reqHeaders = restClientSpy.mock.calls[0][2];
                const timeoutHeader = reqHeaders.find((h: any) =>
                    Object.keys(h).includes(ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT)
                );
                expect(timeoutHeader).toBeDefined();
                expect(timeoutHeader[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]).toEqual(responseTimeout.toString());
            });

            it("should throw an error if the uss file name is null", async () => {
                let response;
                let caughtError;

                // Test for NULL
                try {
                    response = await Utilities.putUSSPayload(dummySession, null, payload);
                } catch (e) {
                    caughtError = e;
                }

                expect(response).toBeUndefined();
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);

            });
            it("should throw an error if the uss file name is not defined", async () => {
                let response;
                let caughtError;

                try {
                    response = await Utilities.putUSSPayload(dummySession, undefined, payload);
                } catch (e) {
                    caughtError = e;
                }

                expect(response).toBeUndefined();
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);
            });

            it("should throw an error if the payload is null", async () => {
                let response;
                let caughtError;

                try {
                    response = await Utilities.putUSSPayload(dummySession, filename, null);
                } catch (e) {
                    caughtError = e;
                }

                expect(response).toBeUndefined();
                expect(caughtError).toBeDefined();

                expect(caughtError.message).toContain(ZosFilesMessages.missingPayload.message);
            });

            it("should throw an error if the payload is not defined", async () => {
                let response;
                let caughtError;

                try {
                    response = await Utilities.putUSSPayload(dummySession, filename, undefined);
                } catch (e) {
                    caughtError = e;
                }

                expect(response).toBeUndefined();
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(ZosFilesMessages.missingPayload.message);
            });

            it("should get chtag response", async () => {
                let response;
                let caughtError;

                try {
                    response = await Utilities.putUSSPayload(dummySession, filename, payload);
                } catch (e) {
                    caughtError = e;
                }

                const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substring(1)));

                expect(caughtError).toBeUndefined();
                expect(response).toEqual(content);

                expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
                expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                    [{"Content-Type": "application/json"}, {"Content-Length": "35"}, ZosmfHeaders.ACCEPT_ENCODING], payload);
            });
        });

        describe("isFileTagBinOrAscii changing content", () => {
            const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer");
            it("should get a positive indication to UTF-8", async () => {
                let response;
                let caughtError;
                zosmfExpectSecondSpy.mockClear();
                const content1 = Buffer.from(JSON.stringify({stdout:["m UTF-8   T=off /tmp/file"]}));
                zosmfExpectSecondSpy.mockImplementation(async () => content1);
                try {
                    response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
                } catch (e) {
                    caughtError = e;
                }

                const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substring(1)));

                expect(caughtError).toBeUndefined();
                expect(response).toEqual(true);

                expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
                expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                    [{"Content-Type": "application/json"}, {"Content-Length": "35"}, ZosmfHeaders.ACCEPT_ENCODING], payload);
            });
            it("should get a positive indication to binary", async () => {
                let response;
                let caughtError;
                zosmfExpectSecondSpy.mockClear();
                const content1 = Buffer.from(JSON.stringify({stdout:["b binary  T=on /tmp/file"]}));
                zosmfExpectSecondSpy.mockImplementation(async () => content1);
                try {
                    response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
                } catch (e) {
                    caughtError = e;
                }

                const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substring(1)));

                expect(caughtError).toBeUndefined();
                expect(response).toEqual(true);

                expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
                expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                    [{"Content-Type": "application/json"}, {"Content-Length": "35"}, ZosmfHeaders.ACCEPT_ENCODING], payload);
            });
            it("should get a negative indication to untagged", async () => {
                let response;
                let caughtError;
                zosmfExpectSecondSpy.mockClear();
                const content1 = Buffer.from(JSON.stringify({stdout:["- untagged  T=on /tmp/file"]}));
                zosmfExpectSecondSpy.mockImplementation(async () => content1);
                try {
                    response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
                } catch (e) {
                    caughtError = e;
                }

                const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substring(1)));

                expect(caughtError).toBeUndefined();
                expect(response).toEqual(false);

                expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
                expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                    [{"Content-Type": "application/json"}, {"Content-Length": "35"}, ZosmfHeaders.ACCEPT_ENCODING], payload);
            });
            it("should get a negative indication to empty", async () => {
                let response;
                let caughtError;
                zosmfExpectSecondSpy.mockClear();
                const content1 = Buffer.from(JSON.stringify({}));
                zosmfExpectSecondSpy.mockImplementation(async () => content1);
                try {
                    response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
                } catch (e) {
                    caughtError = e;
                }

                const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substring(1)));

                expect(caughtError).toBeUndefined();
                expect(response).toEqual(false);

                expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
                expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                    [{"Content-Type": "application/json"}, {"Content-Length": "35"}, ZosmfHeaders.ACCEPT_ENCODING], payload);
            });
        });

        describe("isFileTagBinOrAscii", () => {
            const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer");

            beforeEach(() => {
                zosmfExpectSecondSpy.mockClear();
                zosmfExpectSecondSpy.mockImplementation(async () => content);
            });

            it("should throw an error if the uss file name is null", async () => {
                let response;
                let caughtError;

                // Test for NULL
                try {
                    response = await Utilities.isFileTagBinOrAscii(dummySession, null);
                } catch (e) {
                    caughtError = e;
                }

                expect(response).toBeUndefined();
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);

            });
            it("should throw an error if the uss file name is not defined", async () => {
                let response;
                let caughtError;

                try {
                    response = await Utilities.isFileTagBinOrAscii(dummySession, undefined);
                } catch (e) {
                    caughtError = e;
                }

                expect(response).toBeUndefined();
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);
            });

            it("should get a positive indication to ISO references", async () => {
                let response;
                let caughtError;

                try {
                    response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
                } catch (e) {
                    caughtError = e;
                }

                const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substring(1)));
                expect(caughtError).toBeUndefined();
                expect(response).toEqual(true);

                expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
                expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                    [{"Content-Type": "application/json"}, {"Content-Length": "35"}, ZosmfHeaders.ACCEPT_ENCODING], payload);
            });

            it("should pass responseTimeout to putUSSPayload", async () => {
                const responseTimeout = 5;
                //simulated response from a binary file.
                const simulatedResponse = Buffer.from(JSON.stringify({ stdout: ["b binary T=on /u/testfile"] }));
                const spy = jest.spyOn(Utilities, "putUSSPayload")
                    .mockResolvedValue(simulatedResponse);
                const result = await Utilities.isFileTagBinOrAscii(dummySession, "/u/testfile", responseTimeout);
                expect(result).toEqual(true);
                expect(spy).toHaveBeenCalledWith(
                    dummySession,
                    "/u/testfile",
                    expect.any(Object),
                    responseTimeout
                );
            });

        });

        describe("applyTaggedEncoding", () => {
            const dummySession = new Session({
                user: "fake",
                password: "fake",
                hostname: "fake",
                port: 443,
                protocol: "https",
                type: "basic"
            });
            const ussname = "/u/zowe/test";

            it("should pass responseTimeout to putUSSPayload", async () => {
                const responseTimeout = 5;
                // simulated response from a binary file
                const simulatedResponse = Buffer.from(JSON.stringify({ stdout: ["b binary T=on /u/testfile"] }));
                const spy = jest.spyOn(Utilities, "putUSSPayload")
                    .mockResolvedValue(simulatedResponse);
                const options: IOptions = {};
                await Utilities.applyTaggedEncoding(dummySession, "/u/testfile", options, responseTimeout);
                expect(options.binary).toEqual(true);
                expect(spy).toHaveBeenCalledWith(
                    dummySession,
                    "/u/testfile",
                    expect.any(Object),
                    responseTimeout
                );
            });

            it("should set binary property if file is tagged as binary", async () => {
                jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(Buffer.from(JSON.stringify({
                    stdout: ["b binary\tT=off\t" + ussname]
                })));
                const options: any = {};
                await Utilities.applyTaggedEncoding(dummySession, ussname, options);
                expect(options.binary).toBe(true);
                expect(options.encoding).toBeUndefined();
            });

            it("should set binary property if file encoding is ISO8859-1", async () => {
                jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(Buffer.from(JSON.stringify({
                    stdout: ["t ISO8859-1\tT=on\t" + ussname]
                })));
                const options: any = {};
                await Utilities.applyTaggedEncoding(dummySession, ussname, options);
                expect(options.binary).toBe(true);
                expect(options.encoding).toBeUndefined();
            });

            it("should set binary property if file encoding is UCS-2", async () => {
                jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(Buffer.from(JSON.stringify({
                    stdout: ["t UCS-2\tT=on\t" + ussname]
                })));
                const options: any = {};
                await Utilities.applyTaggedEncoding(dummySession, ussname, options);
                expect(options.binary).toBe(true);
                expect(options.encoding).toBeUndefined();
            });

            it("should set binary property if file encoding is UTF-8", async () => {
                jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(Buffer.from(JSON.stringify({
                    stdout: ["t UTF-8\tT=on\t" + ussname]
                })));
                const options: any = {};
                await Utilities.applyTaggedEncoding(dummySession, ussname, options);
                expect(options.binary).toBe(true);
                expect(options.encoding).toBeUndefined();
            });

            it("should set encoding property if file encoding has IBM prefix", async () => {
                jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(Buffer.from(JSON.stringify({
                    stdout: ["t IBM-1047\tT=on\t" + ussname]
                })));
                const options: any = {};
                await Utilities.applyTaggedEncoding(dummySession, ussname, options);
                expect(options.binary).toBeUndefined();
                expect(options.encoding).toBe("IBM-1047");
            });

            it("should do nothing if file is untagged", async () => {
                jest.spyOn(Utilities, "putUSSPayload").mockResolvedValueOnce(Buffer.from(JSON.stringify({
                    stdout: ["- untagged\tT=off\t" + ussname]
                })));
                const options: any = {};
                await Utilities.applyTaggedEncoding(dummySession, ussname, options);
                expect(options.binary).toBeUndefined();
                expect(options.encoding).toBeUndefined();
            });
        });

        describe("renameUSSFile", () => {
            const dummySession = new Session({
                user: "fake",
                password: "fake",
                hostname: "fake",
                port: 443,
                protocol: "https",
                type: "basic"
            });

            it("should fail if new file path is not passed in", async () => {
                let error: Error;
                try {
                    await Utilities.renameUSSFile(dummySession, "/u/zowe/test", undefined);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeDefined();
                expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
            });
            it("should execute if all parameters are provided", async () => {
                let error: Error;
                let renameResponse;
                jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockResolvedValue(Buffer.from(""));
                const zosmfExpectSpy = jest.spyOn(Utilities, "putUSSPayload");
                const oldPath = "/u/zowe/test";
                const newPath= "/u/zowe/test1";
                try {
                    renameResponse = await Utilities.renameUSSFile(dummySession, oldPath, newPath);
                } catch (err) {
                    error = err;
                }
                expect(error).not.toBeDefined();
                expect(renameResponse).toBeTruthy();
                const payload = { request: "move", from: oldPath };
                expect(zosmfExpectSpy).toHaveBeenLastCalledWith(dummySession, newPath, payload);
            });

            it("should pass responseTimeout to putUSSPayload", async () => {
                const responseTimeout = 5;
                const spy = jest.spyOn(Utilities, "putUSSPayload")
                    .mockResolvedValue(Buffer.from("dummy"));
                const oldPath = "/u/old";
                const newPath = "/u/new";
                await Utilities.renameUSSFile(dummySession, oldPath, newPath, responseTimeout);
                expect(spy).toHaveBeenCalledWith(
                    dummySession,
                    newPath,
                    expect.any(Object),
                    responseTimeout
                );
            });
        });

        describe("Utilities.chtag", () => {
            it("should pass responseTimeout to putUSSPayload", async () => {
                const responseTimeout = 5;
                const spy = jest.spyOn(Utilities, "putUSSPayload")
                    .mockResolvedValue(Buffer.from("dummy"));
                // Call chtag with responseTimeout.
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
});