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

import { Utilities, IZosFilesResponse, ZosFilesMessages, Tag, ZosFilesConstants } from "../../../../src/api";
import { Session, Headers } from "@zowe/imperative";
import { ZosmfRestClient } from "../../../../../rest";
import { posix } from "path";

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
                response = await Utilities.chtag(dummySession,undefined,undefined);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should throw an error if codeset is specified with Tag.BINARY", async () => {
            try {
                response = await Utilities.chtag(dummySession,"/testfile",Tag.BINARY,"ISO8859-1");
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain("A codeset cannot be specified for a binary file.");
        });

        it("should make a REST request to set the tag to binary", async () => {
           await testChtagExpectPayload({type: Tag.BINARY}, { request: "chtag", action: "set", type: "binary"});
        });

        it("should make a REST request to set the tag to text", async () => {
            await testChtagExpectPayload({type: Tag.TEXT}, { request: "chtag", action: "set", type: "text"});
        });

        it("should make a REST request to set the tag with a codeset", async () => {
            await testChtagExpectPayload({type: Tag.TEXT, codeset: "ISO8859-1"},
                                         {request: "chtag", action: "set", type: "text", codeset: "ISO8859-1"});
        });

        it("should URI-encoded the path", async () => {
            const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockReturnValue({});

            response = await Utilities.chtag(dummySession,"/test file",Tag.TEXT,"ISO8859-1");

            expect(response.success).toBeTruthy();
            const expectedUrl = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + "/test%20file";
            expect(restClientSpy).toHaveBeenCalledWith(dummySession, expectedUrl, expect.anything(),
                expect.anything());
        });

        async function testChtagExpectPayload(args: IChtagArgs, expectedPayload: any) {
            const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockReturnValue({});

            response = await Utilities.chtag(dummySession,"/testfile",args.type,args.codeset);

            expect(response.success).toBeTruthy();
            const expectedUrl = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + "/testfile";
            expect(restClientSpy).toHaveBeenCalledWith(dummySession, expectedUrl,
                [Headers.APPLICATION_JSON, { [Headers.CONTENT_LENGTH] : JSON.stringify(expectedPayload).length.toString() }],
                expectedPayload);
        }
    });
});
interface IChtagArgs {
    type: Tag;
    codeset?: string;
}

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
    const content = new Buffer(JSON.stringify({stdout:["m ISO8859-1   T=off /tmp/file"]}));

    describe("putUSSPayload", () => {
        const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer");

        beforeEach(() => {
            zosmfExpectSecondSpy.mockClear();
            zosmfExpectSecondSpy.mockImplementation(() => content);
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

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substr(1)));

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
            const binary = true;

            try {
                response = await Utilities.putUSSPayload(dummySession, filename, payload);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual(content);

            expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [{"Content-Type": "application/json"}, {"Content-Length": "35"}], payload);
        });
    });
    describe("isFileTagBinOrAscii", () => {
        const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer");

        beforeEach(() => {
            zosmfExpectSecondSpy.mockClear();
            zosmfExpectSecondSpy.mockImplementation(() => content);
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
            const binary = true;

            try {
                response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substr(1)));
            expect(caughtError).toBeUndefined();
            expect(response).toEqual(true);

            expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [{"Content-Type": "application/json"}, {"Content-Length": "35"}], payload);
        });
    });
    describe("isFileTagBinOrAscii changing content", () => {
        const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer");
        it("should get a positive indication to UTF-8", async () => {
            let response;
            let caughtError;
            zosmfExpectSecondSpy.mockClear();
            const content1 = new Buffer(JSON.stringify({stdout:["m UTF-8   T=off /tmp/file"]}));
            zosmfExpectSecondSpy.mockImplementation(() => content1);
            try {
                response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual(true);

            expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [{"Content-Type": "application/json"}, {"Content-Length": "35"}], payload);
        });
        it("should get a positive indication to binary", async () => {
            let response;
            let caughtError;
            zosmfExpectSecondSpy.mockClear();
            const content1 = new Buffer(JSON.stringify({stdout:["b binary  T=on /tmp/file"]}));
            zosmfExpectSecondSpy.mockImplementation(() => content1);
            try {
                response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual(true);

            expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [{"Content-Type": "application/json"}, {"Content-Length": "35"}], payload);
        });
        it("should get a negative indication to untagged", async () => {
            let response;
            let caughtError;
            zosmfExpectSecondSpy.mockClear();
            const content1 = new Buffer(JSON.stringify({stdout:["- untagged  T=on /tmp/file"]}));
            zosmfExpectSecondSpy.mockImplementation(() => content1);
            try {
                response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual(false);

            expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [{"Content-Type": "application/json"}, {"Content-Length": "35"}], payload);
        });
        it("should get a negative indication to empty", async () => {
            let response;
            let caughtError;
            zosmfExpectSecondSpy.mockClear();
            const content1 = new Buffer(JSON.stringify({}));
            zosmfExpectSecondSpy.mockImplementation(() => content1);
            try {
                response = await Utilities.isFileTagBinOrAscii(dummySession, filename);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(filename.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual(false);

            expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [{"Content-Type": "application/json"}, {"Content-Length": "35"}], payload);
        });
    });
});
