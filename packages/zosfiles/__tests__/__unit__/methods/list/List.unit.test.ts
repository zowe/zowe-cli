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

import { ImperativeError, Session } from "@zowe/imperative";
import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { List } from "../../../../src/methods/list/List";
import { ZosFilesMessages } from "../../../../src/constants/ZosFiles.messages";
import { posix } from "path";
import { ZosFilesConstants } from "../../../../src/constants/ZosFiles.constants";
import { IListOptions } from "../../../../src";
import * as util from "util";

describe("z/OS Files - List", () => {
    const expectJsonSpy = jest.spyOn(ZosmfRestClient, "getExpectJSON");
    const expectStringSpy = jest.spyOn(ZosmfRestClient, "getExpectString");
    const dsname = "USER.DATA.SET";
    const path = "/u/myuser";
    const listApiResponse = {
        items: [
            {member: "m1"},
            {member: "m2"}
        ]
    };
    const listApiResponseString = `{
    "items": [
        {"member": "m1"},
        {"member": "m2"}
    ]
}`;
    const fsname = "USER.DATA.SET";

    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("allMembers", () => {
        beforeEach(() => {
            expectStringSpy.mockClear();
            expectStringSpy.mockImplementation(async () => listApiResponseString);
        });

        it("should throw an error if the data set name is not specified", async () => {
            let response;
            let caughtError;

            // Test for NULL
            try {
                response = await List.allMembers(dummySession, null);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;
            // Test for UNDEFINED
            try {
                response = await List.allMembers(dummySession, undefined);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;
            // Test for EMPTY
            try {
                response = await List.allMembers(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should indicate that the data set is empty", async () => {
            let response;
            let caughtError;

            expectStringSpy.mockResolvedValueOnce(`{"items": []}`);

            try {
                response = await List.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname, ZosFilesConstants.RES_DS_MEMBERS);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: null,
                apiResponse: {items: []}
            });
            expect(expectStringSpy).toHaveBeenCalledTimes(1);
            expect(expectStringSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should list members from given data set", async () => {
            let response;
            let caughtError;

            try {
                response = await List.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname, ZosFilesConstants.RES_DS_MEMBERS);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: null,
                apiResponse: listApiResponse
            });
            expect(expectStringSpy).toHaveBeenCalledTimes(1);
            expect(expectStringSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should list members from given data set with responseTimeout", async () => {
            let response;
            let caughtError;
            const options: IListOptions = {responseTimeout: 5};

            try {
                response = await List.allMembers(dummySession, dsname, options);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname, ZosFilesConstants.RES_DS_MEMBERS);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: null,
                apiResponse: listApiResponse
            });
            expect(expectStringSpy).toHaveBeenCalledTimes(1);
            expect(expectStringSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS, {[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: "5"}]);
        });

        it("should list members from given data set that contains a member with an invalid name", async () => {
            let response;
            let caughtError;

            const memberNames = ["m1", "m2"];
            const shuffledAsciiChars = String.fromCharCode(...Array.from(Array(256).keys()).sort(() => Math.random() - 0.5));
            for (let i = 0; i < 32; i++) {
                memberNames.push(shuffledAsciiChars.slice(i * 8, (i + 1) * 8));
            }
            expectStringSpy.mockResolvedValueOnce(`{"items":[\n` +
                memberNames.map((memName) => `  {"member":"${memName}"}`).join(",\n") + `\n` +
                `],"returnedRows":${memberNames.length},"JSONversion":1}`);

            const expectedListApiResponse = {
                items: expect.arrayContaining([
                    { member: "m1" },
                    { member: "m2" },
                    { member: expect.stringMatching(/… (\d+) more members/) }
                ]),
                returnedRows: 34,
                JSONversion: 1
            };
            try {
                response = await List.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname, ZosFilesConstants.RES_DS_MEMBERS);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: null,
                apiResponse: expectedListApiResponse
            });
            expect(expectStringSpy).toHaveBeenCalledTimes(1);
            expect(expectStringSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should list members from given data set with a matching pattern", async () => {
            let response;
            let caughtError;

            const pattern = "TEST*";
            const query = `?pattern=${pattern}`;

            try {
                response = await List.allMembers(dummySession, dsname, {
                    pattern: "TEST*"
                });
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname, ZosFilesConstants.RES_DS_MEMBERS + query);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: null,
                apiResponse: listApiResponse
            });
            expect(expectStringSpy).toHaveBeenCalledTimes(1);
            expect(expectStringSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should list members from given data set with additional attributes", async () => {
            let response;
            let caughtError;

            try {
                response = await List.allMembers(dummySession, dsname, {
                    attributes: true
                });
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname, ZosFilesConstants.RES_DS_MEMBERS);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: null,
                apiResponse: listApiResponse
            });
            expect(expectStringSpy).toHaveBeenCalledTimes(1);
            expect(expectStringSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_ATTRIBUTES_BASE, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should handle a Zosmf REST client error", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            expectStringSpy.mockImplementationOnce(() => {
                throw dummyError;
            });

            try {
                response = await List.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError).toEqual(dummyError);
        });
    });

    describe("dataSet", () => {
        beforeEach(() => {
            expectJsonSpy.mockClear();
            expectJsonSpy.mockImplementation(async () => listApiResponse);
        });

        it("should throw error when data set name is not specified", async () => {
            let response;
            let error;

            try {
                response = await List.dataSet(dummySession, undefined);
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should throw error when data set name is empty", async () => {
            let response;
            let error;

            try {
                response = await List.dataSet(dummySession, "");
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should throw error when zosmfRestClient.getExpectJSON error", async () => {
            let response;
            let error;
            const testError = new ImperativeError({
                msg: "test error"
            });

            expectJsonSpy.mockRejectedValueOnce(testError);

            try {
                response = await List.dataSet(dummySession, dsname);
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error).toBe(testError);
        });

        it("should indicate that the data set was not found", async () => {
            let response;
            let error;
            const testApiResponse: any = {
                items: []
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.dataSet(dummySession, dsname);
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should return with data when input data set name is valid", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: ["test"]
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.dataSet(dummySession, dsname);
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should return with data when input data set name is valid with responseTimeout", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: ["test"]
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}`);

            const options: IListOptions = {responseTimeout: 5};

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.dataSet(dummySession, dsname, options);
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS, {[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: "5"}]);
        });

        it("should return with data when specify attribute option", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: ["test"]
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.dataSet(dummySession, dsname, {attributes: true});
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_ATTRIBUTES_BASE, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should return with data when specify start and attributes options", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: ["test"]
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}&start=${dsname}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.dataSet(dummySession, dsname, {attributes: true, start: dsname});
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_ATTRIBUTES_BASE, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should return with data when specify recall and attributes options", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: ["test"]
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            // Unit test for wait option
            try {
                response = await List.dataSet(dummySession, dsname, {attributes: true, recall: "wait"});
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_ATTRIBUTES_BASE, ZosmfHeaders.X_IBM_MAX_ITEMS,
                    ZosmfHeaders.X_IBM_MIGRATED_RECALL_WAIT]);
            expectJsonSpy.mockClear();

            // Unit test for nowait option
            try {
                response = await List.dataSet(dummySession, dsname, {attributes: true, recall: "nowait"});
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_ATTRIBUTES_BASE, ZosmfHeaders.X_IBM_MAX_ITEMS,
                    ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT]);
            expectJsonSpy.mockClear();

            // Unit test for error option
            try {
                response = await List.dataSet(dummySession, dsname, {attributes: true, recall: "error"});
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_ATTRIBUTES_BASE, ZosmfHeaders.X_IBM_MAX_ITEMS,
                    ZosmfHeaders.X_IBM_MIGRATED_RECALL_ERROR]);
            expectJsonSpy.mockClear();
        });

        it("should return with data when specify volume and attributes options", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: ["test"]
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}&volser=VOLSER`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.dataSet(dummySession, dsname, {attributes: true, volume: "VOLSER"});
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_ATTRIBUTES_BASE, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });
    });

    describe("fileList", () => {
        beforeEach(() => {
            expectJsonSpy.mockClear();
            expectJsonSpy.mockImplementation(async () => listApiResponse);
        });

        it("should throw error when path name is not specified", async () => {
            let response;
            let error;

            try {
                response = await List.fileList(dummySession, undefined);
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should throw error when file name is empty", async () => {
            let response;
            let error;

            try {
                response = await List.fileList(dummySession, "");
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should throw error when zosmfRestClient.getExpectJSON error", async () => {
            let response;
            let error;
            const testError = new ImperativeError({
                msg: "test error"
            });

            expectJsonSpy.mockRejectedValueOnce(testError);

            try {
                response = await List.fileList(dummySession, path);
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error).toBe(testError);
        });

        it("should indicate that the path was not found", async () => {
            let response;
            let error;
            const testApiResponse: any = {
                items: []
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_USS_FILES}?${ZosFilesConstants.RES_PATH}=${encodeURIComponent(path)}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.fileList(dummySession, path);
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should return with files when input path name is valid", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: [
                    {
                        name: ".", mode: "drwxrwxrwx", size: 8192, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-11-24T02:12:04"
                    },
                    {
                        name: "..", mode: "drwxr-xr-x", size: 8192, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-09-15T02:38:29"
                    },
                    {
                        name: ".profile", mode: "-rwxrwxrwx", size: 849, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2013-02-13T12:08:29"
                    },
                    {
                        name: ".sh_history", mode: "-rw-------", size: 4662, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2013-06-06T18:09:28"
                    },
                    {
                        name: "myFile.txt", mode: "-rw-r--r--", size: 20, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-11-24T02:12:04"
                    },
                    {
                        name: "profile.add", mode: "-rwxrwxrwx", size: 888, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2013-05-07T11:23:08"
                    }
                ],  returnedRows: 6, totalRows: 6, JSONversion: 1
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_USS_FILES}?${ZosFilesConstants.RES_PATH}=${encodeURIComponent(path)}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.fileList(dummySession, path);
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should return with files when input path name is valid and max items set", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: [
                    {
                        name: ".", mode: "drwxrwxrwx", size: 8192, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-11-24T02:12:04"
                    },
                    {
                        name: "..", mode: "drwxr-xr-x", size: 8192, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-09-15T02:38:29"
                    }
                ],  returnedRows: 2, totalRows: 6, JSONversion: 1
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_USS_FILES}?${ZosFilesConstants.RES_PATH}=${encodeURIComponent(path)}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.fileList(dummySession, path, { maxLength: 2 });
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, {"X-IBM-Max-Items": "2"}]);
        });

        it("should return with files when input path name is valid with responseTimeout and max items set", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: [
                    {
                        name: ".", mode: "drwxrwxrwx", size: 8192, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-11-24T02:12:04"
                    },
                    {
                        name: "..", mode: "drwxr-xr-x", size: 8192, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-09-15T02:38:29"
                    }
                ],  returnedRows: 2, totalRows: 6, JSONversion: 1
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_USS_FILES}?${ZosFilesConstants.RES_PATH}=${encodeURIComponent(path)}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.fileList(dummySession, path, { maxLength: 2, responseTimeout: 5 });
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, {"X-IBM-Max-Items": "2"}, {[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: "5"}]);
        });

        describe("options", () => {

            const testApiResponse = {
                items: [
                    {
                        name: ".", mode: "drwxrwxrwx", size: 8192, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-11-24T02:12:04"
                    },
                    {
                        name: "..", mode: "drwxr-xr-x", size: 8192, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-09-15T02:38:29"
                    },
                    {
                        name: ".profile", mode: "-rwxrwxrwx", size: 849, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2013-02-13T12:08:29"
                    },
                    {
                        name: ".sh_history", mode: "-rw-------", size: 4662, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2013-06-06T18:09:28"
                    },
                    {
                        name: "myFile.txt", mode: "-rw-r--r--", size: 20, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2015-11-24T02:12:04"
                    },
                    {
                        name: "profile.add", mode: "-rwxrwxrwx", size: 888, uid: 0, user: "WSADMIN", gid: 1,
                        group: "OMVSGRP", mtime: "2013-05-07T11:23:08"
                    }
                ],  returnedRows: 6, totalRows: 6, JSONversion: 1
            };
            const endpointTemplate = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_USS_FILES}?${ZosFilesConstants.RES_PATH}=${encodeURIComponent(path)}`);

            it("should add the group name parameter to the URI", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_GROUP}=ZOWE`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {group: "ZOWE"});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the group ID parameter to the URI", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_GROUP}=1000`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {group: 1000});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the user name parameter to the URI", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_USER}=ZOWE`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {user: "ZOWE"});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the user ID parameter to the URI", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_USER}=1000`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {user: 1000});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });


            it("should add the name parameter to the URI", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_NAME}=*`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {name: "*"});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the mtime parameter to the URI - number", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_MTIME}=2`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {mtime: 2});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the mtime parameter to the URI - string", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_MTIME}=%2B2`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {mtime: "+2"});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the size parameter to the URI - number", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_SIZE}=1024`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {size: 1024});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the size parameter to the URI - string", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_SIZE}=%2B1024`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {size: "+1024"});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the perm parameter to the URI", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_PERM}=7777`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {perm: "7777"});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the type parameter to the URI", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_TYPE}=d`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {type: "d"});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the depth parameter to the URI", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_NAME}=*&${ZosFilesConstants.RES_DEPTH}=1`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {name: "*", depth: 1});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the filesys parameter to the URI - true", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_NAME}=*&${ZosFilesConstants.RES_FILESYS}=all`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {name: "*", filesys: true});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the filesys parameter to the URI - false", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_NAME}=*&${ZosFilesConstants.RES_FILESYS}=same`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {name: "*", filesys: false});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the symlinks parameter to the URI - true", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_NAME}=*&${ZosFilesConstants.RES_SYMLINKS}=report`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {name: "*", symlinks: true});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should add the symlinks parameter to the URI - false", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_NAME}=*&${ZosFilesConstants.RES_SYMLINKS}=follow`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {name: "*", symlinks: false});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse).toBe(testApiResponse);
                expect(expectJsonSpy).toHaveBeenCalledTimes(1);
                expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
            });

            it("should fail to add the depth parameter because it is missing a required parameter", async () => {
                let response;
                let error;

                const endpoint = endpointTemplate + `&${ZosFilesConstants.RES_DEPTH}=1`;
                expectJsonSpy.mockResolvedValue(testApiResponse);

                try {
                    response = await List.fileList(dummySession, path, {depth: 1});
                } catch (err) {
                    error = err;
                }

                expect(error).toBeTruthy();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toContain("option to be specified");
                expect(expectJsonSpy).toHaveBeenCalledTimes(0);
            });
        });

    });

    describe("fs", () => {
        beforeEach(() => {
            expectJsonSpy.mockClear();
            expectJsonSpy.mockImplementation(async () => listApiResponse);
        });

        it("should list all mounted filesystems", async () => {
            let response;
            let error;

            try {
                response = await List.fs(dummySession, undefined);
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
        });

        it("should return 2 records of all mounted filesystems", async () => {
            let response;
            let error;

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, `${ZosFilesConstants.RES_MFS}`);

            try {
                response = await List.fs(dummySession, { maxLength: 2 });
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, {"X-IBM-Max-Items": "2"}]);
        });

        it("should return 2 records of all mounted filesystems with responseTimeout", async () => {
            let response;
            let error;

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, `${ZosFilesConstants.RES_MFS}`);

            try {
                response = await List.fs(dummySession, { maxLength: 2, responseTimeout: 5 });
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint,
                [ZosmfHeaders.ACCEPT_ENCODING, {"X-IBM-Max-Items": "2"}, {[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: "5"}]);
        });

        it("should throw error when zosmfRestClient.getExpectJSON error", async () => {
            let response;
            let error;
            const testError = new ImperativeError({
                msg: "test error"
            });

            expectJsonSpy.mockRejectedValueOnce(testError);

            try {
                response = await List.fs(dummySession, undefined);
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error).toBe(testError);
        });

        it("should return with list when input path name is valid", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: [
                    {
                        name: "USER.DATA.SET",
                        mountpoint: "/u/myuser",
                        fstname: "FS",
                        mode: ["rdonly", "acl", "synchonly"],
                        dev: 82,
                        fstype: 1,
                        bsize: 1024,
                        bavail: 45279,
                        blocks: 126720,
                        sysname: "S0W1",
                        writeibc: 0,
                        diribc: 98
                    }
                ],  returnedRows: 1, totalRows: 1, JSONversion: 1
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_MFS}`,`?${ZosFilesConstants.RES_PATH}=${encodeURIComponent(path)}`);
            // const endpoint = posix.join(ZosFilesConstants.RESOURCE,`${ZosFilesConstants.RES_MFS}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.fsWithPath(dummySession, { path });
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should return with list when input fsname is valid", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: [
                    {
                        name: "USER.DATA.SET",
                        mountpoint: "/u/myuser",
                        fstname: "FS",
                        mode: ["rdonly", "acl", "synchonly"],
                        dev: 82,
                        fstype: 1,
                        bsize: 1024,
                        bavail: 45279,
                        blocks: 126720,
                        sysname: "S0W1",
                        writeibc: 0,
                        diribc: 98
                    }
                ],  returnedRows: 1, totalRows: 1, JSONversion: 1
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_MFS}`,`?${ZosFilesConstants.RES_FSNAME}=${encodeURIComponent(fsname)}`);
            // const endpoint = posix.join(ZosFilesConstants.RESOURCE,`${ZosFilesConstants.RES_MFS}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.fs(dummySession, { fsname });
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

    });

    describe("dataSetsMatchingPattern", () => {
        const listDataSetSpy = jest.spyOn(List, "dataSet");

        const dataSetPS = {
            dsname: "TEST.PS.DATA.SET",
            dsorg: "PS"
        };

        const dataSetPO = {
            dsname: "TEST.PO.DATA.SET",
            dsorg: "PO"
        };

        beforeEach(() => {
            listDataSetSpy.mockClear();
            listDataSetSpy.mockResolvedValue({} as any);
        });

        it("should successfully list PS and PO data sets using the List.dataSet API", async () => {
            const pattern = "TEST.**.DATA.SET";
            let response;
            let caughtError;

            listDataSetSpy.mockImplementation(async (): Promise<any> => {
                return {
                    apiResponse: {
                        items: [dataSetPS, dataSetPO]
                    }
                };
            });

            try {
                response = await List.dataSetsMatchingPattern(dummySession, [pattern]);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.dataSetsMatchedPattern.message, 2),
                apiResponse: [dataSetPS, dataSetPO]
            });

            expect(listDataSetSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetSpy).toHaveBeenCalledWith(dummySession, pattern, {attributes: true});
        });

        it("should throw an error if the data set name is not specified", async () => {
            let response;
            let caughtError;

            // Test for NULL
            try {
                response = await List.dataSetsMatchingPattern(dummySession, null);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingPatterns.message);

            caughtError = undefined;
            // Test for UNDEFINED
            try {
                response = await List.dataSetsMatchingPattern(dummySession, undefined);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingPatterns.message);

            caughtError = undefined;
            // Test for EMPTY
            try {
                response = await List.dataSetsMatchingPattern(dummySession, ["", undefined, null]);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingPatterns.message);
        });

        it("should handle an error from the List.dataSet API", async () => {
            const dummyError = new Error("test2");
            let response;
            let caughtError;

            listDataSetSpy.mockImplementation(async () => {
                throw dummyError;
            });

            try {
                response = await List.dataSetsMatchingPattern(dummySession, [dataSetPS.dsname]);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toEqual(dummyError);

            expect(listDataSetSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetSpy).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {attributes: true});
        });

        it("should handle an error from the List.dataSet API 2", async () => {
            const dummyError = new ImperativeError({msg: "test", errorCode: "400"});
            let response;
            let caughtError;

            listDataSetSpy.mockImplementation(async () => {
                throw dummyError;
            });

            try {
                response = await List.dataSetsMatchingPattern(dummySession, [dataSetPS.dsname]);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toEqual(dummyError);

            expect(listDataSetSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetSpy).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {attributes: true});
        });

        it("should handle an error from the List.dataSet API and fall back to fetching attributes sequentially", async () => {
            let response;
            let caughtError;

            listDataSetSpy.mockImplementationOnce(async () => {
                throw new ImperativeError({msg: "test2", errorCode: "500"});
            }).mockImplementation(async (): Promise<any> => {
                return {
                    apiResponse: {
                        items: [dataSetPS]
                    }
                };
            });

            try {
                response = await List.dataSetsMatchingPattern(dummySession, [dataSetPS.dsname]);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.dataSetsMatchedPattern.message, 1),
                apiResponse: [dataSetPS]
            });

            expect(listDataSetSpy).toHaveBeenCalledTimes(3);
            expect(listDataSetSpy).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {attributes: true});
        });

        it("should handle an error when the exclude pattern is specified", async () => {
            const excludePatterns = ["TEST.PS.DATA.SET"];
            let response;
            let caughtError;

            List.dataSet = jest.fn(async (): Promise<any> => {
                return {
                    apiResponse: {
                        items: [dataSetPS]
                    }
                };
            });

            try {
                response = await List.dataSetsMatchingPattern(
                    dummySession, [dataSetPS.dsname], { excludePatterns });
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: false,
                commandResponse: util.format(ZosFilesMessages.noDataSetsInList.message),
                apiResponse: []
            });
        });
    });
});
