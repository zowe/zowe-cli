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

import * as fs from "fs";
import * as path from "path";
import { ImperativeError, IO, Session } from "@zowe/imperative";
import { IDownloadOptions, TransferMode, Utilities, ZosFilesAttributes, ZosFilesMessages } from "../../../../src";
import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { Download } from "../../../../src/methods/download/Download";
import { posix, join } from "path";
import { ZosFilesConstants } from "../../../../src/constants/ZosFiles.constants";
import * as util from "util";
import { IUSSListOptions, List } from "../../../../src/methods/list";
import { CLIENT_PROPERTY } from "../../../../src/doc/types/ZosmfRestClientProperties";
import { IDownloadDsmResult } from "../../../../src/methods/download/doc/IDownloadDsmResult";
import { PassThrough } from "stream";

describe("z/OS Files - Download", () => {
    const dsname = "USER.DATA.SET";
    const dsFolder = "user/data/set";
    const dsContent = Buffer.from("This\nis\r\na\ntest");
    const ussname = "/a/user/test.txt";
    const arrOfUssPath: string[] = ussname.split("/");
    const localFileName = arrOfUssPath[arrOfUssPath.length - 1];
    const ussFileContent = "Test data for unit test";
    const etagValue = "123ABC";

    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    describe("dataset", () => {
        const zosmfStreamSpy = jest.spyOn(ZosmfRestClient, "getStreamed");
        const ioCreateDirSpy = jest.spyOn(IO, "createDirsSyncFromFilePath");
        const ioWriteFileSpy = jest.spyOn(IO, "writeFile");
        const ioWriteStreamSpy = jest.spyOn(IO, "createWriteStream");
        const fakeWriteStream: any = { fakeWriteStream: true };
        const zosmfGetFullSpy = jest.spyOn(ZosmfRestClient, "getExpectFullResponse");
        const fakeResponseWithEtag = {
            data: Buffer.from(ussFileContent),
            response: {headers: { etag: etagValue } }
        };

        beforeEach(() => {
            zosmfStreamSpy.mockClear();
            zosmfStreamSpy.mockImplementation(async (): Promise<any> => null);

            zosmfGetFullSpy.mockClear();
            zosmfGetFullSpy.mockImplementation(async (): Promise<any> => null);

            ioCreateDirSpy.mockClear();
            ioCreateDirSpy.mockImplementation(() => null);

            ioWriteFileSpy.mockClear();
            ioWriteFileSpy.mockImplementation(() => null);

            ioWriteStreamSpy.mockClear();
            ioWriteStreamSpy.mockImplementation(() => fakeWriteStream);
        });

        it("should throw and error if the data set name is not specified", async () => {
            let response;
            let caughtError;

            // Test for NULL
            try {
                response = await Download.dataSet(dummySession, null);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;
            // Test for UNDEFINED
            try {
                response = await Download.dataSet(dummySession, undefined);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;
            // Test for EMPTY
            try {
                response = await Download.dataSet(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should download a data set specifying the volume and extension", async () => {
            let response;
            let caughtError;
            const volume = "testVs";
            const extension = ".test";
            const destination = dsFolder + extension;

            try {
                response = await Download.dataSet(dummySession, dsname, {volume, extension});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(${volume})`, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, destination),
                apiResponse: {}
            });


            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: true,
                task: undefined});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
        });

        it("should download a data set specifying \"\" as extension", async () => {
            let response;
            let caughtError;
            const volume = "testVs";
            const extension = "";
            const destination = dsFolder + extension;

            try {
                response = await Download.dataSet(dummySession, dsname, {volume, extension});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(${volume})`, dsname);
            const newDsContent = IO.processNewlines(dsContent.toString());

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: true,
                task: undefined});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
        });

        it("should download a data set in binary mode and default extension", async () => {
            let response;
            let caughtError;
            const binary = true;
            const destination = dsFolder + ".txt";

            try {
                response = await Download.dataSet(dummySession, dsname, {binary});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                // TODO:gzip
                // reqHeaders: [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING],
                reqHeaders: [ZosmfHeaders.X_IBM_BINARY],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: false /* don't normalize newlines, binary mode*/,
                task: undefined /* no progress task */});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
        });

        it("should download a data set to the given file in binary mode", async () => {
            let response;
            let caughtError;
            const binary = true;
            const file = "my/test/file.xyz";

            try {
                response = await Download.dataSet(dummySession, dsname, {binary, file});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, file),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                // TODO:gzip
                // reqHeaders: [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING],
                reqHeaders: [ZosmfHeaders.X_IBM_BINARY],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: false, /* no normalizing new lines, binary mode*/
                task: undefined /*no progress task*/});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(file);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(file);
        });

        it("should download a data set to the given file in binary mode if record specified", async () => {
            let response;
            let caughtError;
            const binary = true;
            const record = true;
            const file = "my/test/file.xyz";

            try {
                response = await Download.dataSet(dummySession, dsname, {binary, record, file});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, file),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                // TODO:gzip
                // reqHeaders: [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING],
                reqHeaders: [ZosmfHeaders.X_IBM_BINARY],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: false, /* no normalizing new lines, binary mode*/
                task: undefined /*no progress task*/});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(file);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(file);
        });

        it("should download a data set in record mode and default extension", async () => {
            let response;
            let caughtError;
            const record = true;
            const destination = dsFolder + ".txt";

            try {
                response = await Download.dataSet(dummySession, dsname, {record});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                // TODO:gzip
                // reqHeaders: [ZosmfHeaders.X_IBM_RECORD, ZosmfHeaders.ACCEPT_ENCODING],
                reqHeaders: [ZosmfHeaders.X_IBM_RECORD],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: false /* don't normalize newlines, record mode*/,
                task: undefined /* no progress task */});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
        });

        it("should download a data set to the given file in record mode", async () => {
            let response;
            let caughtError;
            const record = true;
            const file = "my/test/file.xyz";

            try {
                response = await Download.dataSet(dummySession, dsname, {record, file});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, file),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                // TODO:gzip
                // reqHeaders: [ZosmfHeaders.X_IBM_RECORD, ZosmfHeaders.ACCEPT_ENCODING],
                reqHeaders: [ZosmfHeaders.X_IBM_RECORD],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: false, /* no normalizing new lines, record mode*/
                task: undefined /*no progress task*/});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(file);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(file);
        });

        it("should download a data set specifying preserveOriginalLetterCase", async () => {
            let response;
            let caughtError;
            const binary = true;
            const destination = dsFolder.toUpperCase() + ".txt";

            try {
                response = await Download.dataSet(dummySession, dsname, { preserveOriginalLetterCase: true });
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: true,
                task: undefined /* no progress task */});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
        });

        it("should download a data set to the given file in encoding requested mode", async () => {
            let response;
            let caughtError;
            const encoding = "285";
            const file = "my/test/file.xyz";

            try {
                response = await Download.dataSet(dummySession, dsname, {encoding, file});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, file),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {
                resource: endpoint,
                reqHeaders: [{ "X-IBM-Data-Type": "text;fileEncoding=285" }, ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: true,
                task: undefined /* no progress task */
            });

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(file);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(file);
        });

        it("should download a data set using responseTimeout", async () => {
            let response;
            let caughtError;
            const responseTimeout = 5;
            const destination = dsFolder + ".txt";

            try {
                response = await Download.dataSet(dummySession, dsname, {responseTimeout});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, { "X-IBM-Response-Timeout": "5" }, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: true,
                task: undefined /* no progress task */});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(destination);
        });

        it("should download a data set and return Etag", async () => {
            zosmfGetFullSpy.mockImplementationOnce(async () => fakeResponseWithEtag);
            let response;
            let caughtError;
            const volume = "testVs";
            const extension = ".test";
            const destination = dsFolder + extension;


            try {
                response = await Download.dataSet(dummySession, dsname, {volume, extension, returnEtag: true});
            } catch (e) {
                caughtError = e;
            }
            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(${volume})`, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, destination),
                apiResponse: {etag: etagValue}
            });


            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN, ZosmfHeaders.X_IBM_RETURN_ETAG],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: true,
                task: undefined,
                dataToReturn: [CLIENT_PROPERTY.response]}); // import and use proper property

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
        });

        it("should handle a z/OS MF error", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            // zosmfStreamSpy.mockImplementation(() => {
            //     throw dummyError;
            // });
            zosmfGetFullSpy.mockImplementation(() => {
                throw dummyError;
            });

            try {
                response = await Download.dataSet(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(response).toBeUndefined();
            expect(caughtError).toEqual(dummyError);

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeWriteStream,
                normalizeResponseNewLines: true,
                task: undefined /*no progress task*/});

        });

        it("should download a data set to a stream", async () => {
            let response;
            let caughtError;
            const responseStream = new PassThrough();

            try {
                response = await Download.dataSet(dummySession, dsname, { stream: responseStream });
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetDownloadedSuccessfully.message,
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream,
                normalizeResponseNewLines: true,
                task: undefined /*no progress task*/});

            expect(ioCreateDirSpy).not.toHaveBeenCalled();
            expect(ioWriteStreamSpy).not.toHaveBeenCalled();
        });
    });

    describe("allMembers", () => {
        const listAllMembersSpy = jest.spyOn(List, "allMembers");
        const downloadDatasetSpy = jest.spyOn(Download, "dataSet");

        const listApiResponse = {
            items: [
                {member: "M1"},
                {member: "M2"}
            ]
        };

        beforeEach(() => {
            listAllMembersSpy.mockClear();
            listAllMembersSpy.mockImplementation(async (): Promise<any> => {
                return { apiResponse: listApiResponse };
            });

            downloadDatasetSpy.mockClear();
            downloadDatasetSpy.mockResolvedValue(null as any);
        });

        it("should throw and error if the data set name is not specified", async () => {
            let response;
            let caughtError;

            // Test for NULL
            try {
                response = await Download.allMembers(dummySession, null);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;
            // Test for UNDEFINED
            try {
                response = await Download.allMembers(dummySession, undefined);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;
            // Test for EMPTY
            try {
                response = await Download.allMembers(dummySession, "");
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

            listAllMembersSpy.mockResolvedValueOnce({ apiResponse: { items: [] } } as any);

            try {
                response = await Download.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: false,
                commandResponse: ZosFilesMessages.noMembersFound.message,
                apiResponse: {items: []}
            });

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {});

            expect(downloadDatasetSpy).not.toHaveBeenCalled();
        });

        it("should download all members without any options", async () => {
            let response;
            let caughtError;

            try {
                response = await Download.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, dsFolder),
                apiResponse: listApiResponse
            });

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(2);
            listApiResponse.items.forEach((mem) => {
                expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${mem.member})`, {
                    file: `${dsFolder}/${mem.member.toLowerCase()}.txt`
                });
            });
        });

        it("should download all members specifying directory, volume, extension, and binary mode", async () => {
            let response;
            let caughtError;

            const volume = "testVs";
            const directory = "my/test/path/";
            const extension = ".xyz";
            const binary = true;

            try {
                response = await Download.allMembers(dummySession, dsname, {volume, directory, extension, binary});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, directory),
                apiResponse: listApiResponse
            });

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {volume});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(2);
            listApiResponse.items.forEach((mem) => {
                expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${mem.member})`, {
                    volume,
                    file: `${directory}/${mem.member.toLowerCase()}${extension}`,
                    binary
                });
            });
        });

        it("should download all members specifying directory, volume, extension, and record mode", async () => {
            let response;
            let caughtError;

            const volume = "testVs";
            const directory = "my/test/path/";
            const extension = ".xyz";
            const record = true;

            try {
                response = await Download.allMembers(dummySession, dsname, {volume, directory, extension, record});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, directory),
                apiResponse: listApiResponse
            });

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {volume});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(2);
            listApiResponse.items.forEach((mem) => {
                expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${mem.member})`, {
                    volume,
                    file: `${directory}/${mem.member.toLowerCase()}${extension}`,
                    record
                });
            });
        });

        it("should download all members specifying directory, volume, extension, responseTimeout and binary mode", async () => {
            let response;
            let caughtError;

            const volume = "testVs";
            const directory = "my/test/path/";
            const extension = ".xyz";
            const binary = true;
            const responseTimeout = 5;

            try {
                response = await Download.allMembers(dummySession, dsname, {volume, directory, extension, binary, responseTimeout});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, directory),
                apiResponse: listApiResponse
            });

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {volume, responseTimeout});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(2);
            listApiResponse.items.forEach((mem) => {
                expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${mem.member})`, {
                    volume,
                    file: `${directory}/${mem.member.toLowerCase()}${extension}`,
                    binary,
                    encoding: undefined,
                    responseTimeout
                });
            });
        });

        it("should download all members specifying directory, volume, extension, responseTimeout and record mode", async () => {
            let response;
            let caughtError;

            const volume = "testVs";
            const directory = "my/test/path/";
            const extension = ".xyz";
            const record = true;
            const responseTimeout = 5;

            try {
                response = await Download.allMembers(dummySession, dsname, {volume, directory, extension, record, responseTimeout});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, directory),
                apiResponse: listApiResponse
            });

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {volume, responseTimeout});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(2);
            listApiResponse.items.forEach((mem) => {
                expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${mem.member})`, {
                    volume,
                    file: `${directory}/${mem.member.toLowerCase()}${extension}`,
                    record,
                    encoding: undefined,
                    responseTimeout
                });
            });
        });

        it("should download all members specifying directory, volume, extension, and encoding mode", async () => {
            let response;
            let caughtError;

            const volume = "testVs";
            const directory = "my/test/path/";
            const extension = ".xyz";
            const encoding = "285";

            try {
                response = await Download.allMembers(dummySession, dsname, {volume, directory, extension, encoding});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, directory),
                apiResponse: listApiResponse
            });

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {volume});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(2);
            listApiResponse.items.forEach((mem) => {
                expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${mem.member})`, {
                    volume,
                    file: `${directory}/${mem.member.toLowerCase()}${extension}`,
                    encoding
                });
            });
        });

        it("should download all members with specified \"\" extension", async () => {
            let response;
            let caughtError;

            const volume = "testVs";
            const directory = "my/test/path/";
            const extension = "";
            const binary = true;

            try {
                response = await Download.allMembers(dummySession, dsname, {volume, directory, extension, binary});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, directory),
                apiResponse: listApiResponse
            });

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {volume});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(2);
            listApiResponse.items.forEach((mem) => {
                expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${mem.member})`, {
                    volume,
                    file: `${directory}/${mem.member.toLowerCase()}${extension}`,
                    binary
                });
            });
        });

        it("should download all members specifying preserveOriginalLetterCase", async () => {
            let response;
            let caughtError;

            try {
                response = await Download.allMembers(dummySession, dsname, { preserveOriginalLetterCase: true });
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, dsFolder.toUpperCase()),
                apiResponse: listApiResponse
            });

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(2);
            listApiResponse.items.forEach((mem) => {
                expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${mem.member})`, {
                    file: `${dsFolder.toUpperCase()}/${mem.member}.txt`
                });
            });
        });

        it("should handle an error from the List.allMembers API", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            listAllMembersSpy.mockImplementation(async () => {
                throw dummyError;
            });

            try {
                response = await Download.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toEqual(dummyError);

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {});

            expect(downloadDatasetSpy).not.toHaveBeenCalled();
        });

        it("should handle an error from Download.dataSet", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            downloadDatasetSpy.mockImplementation(async () => {
                throw dummyError;
            });

            try {
                response = await Download.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toEqual(dummyError);

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(1);
            const firstItem = listApiResponse.items[0];
            expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${firstItem.member})`, {
                file: `${dsFolder}/${firstItem.member.toLowerCase()}.txt`
            });
        });

        it("should delay handling an error from Download.dataSet when failFast option is false", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            downloadDatasetSpy.mockImplementation(async () => {
                throw dummyError;
            });

            try {
                response = await Download.allMembers(dummySession, dsname, {failFast: false});
            } catch (e) {
                caughtError = e;
            }

            const firstItem = listApiResponse.items[0];
            const secondItem = listApiResponse.items[1];

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toEqual(ZosFilesMessages.memberDownloadFailed.message +
                `${firstItem.member.toLowerCase()}\n${secondItem.member.toLowerCase()}\n\n${dummyError.message}\n${dummyError.message}`);

            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, dsname, {});

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(2);
            expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${firstItem.member})`, {
                file: `${dsFolder}/${firstItem.member.toLowerCase()}.txt`
            });
            expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, `${dsname}(${secondItem.member})`, {
                file: `${dsFolder}/${secondItem.member.toLowerCase()}.txt`
            });
        });
    });

    describe("allDataSets", () => {
        const listDataSetSpy = jest.spyOn(List, "dataSet");
        const downloadDatasetSpy = jest.spyOn(Download, "dataSet");
        const downloadAllMembersSpy = jest.spyOn(Download, "allMembers");
        const createDirsSpy = jest.spyOn(IO, "createDirsSyncFromFilePath");

        const dataSetPS = {
            dsname: "TEST.PS.DATA.SET",
            dsorg: "PS"
        };

        const dataSetPO = {
            dsname: "TEST.PO.DATA.SET",
            dsorg: "PO"
        };

        beforeEach(() => {
            downloadDatasetSpy.mockClear();
            downloadDatasetSpy.mockResolvedValue(undefined as any);

            downloadAllMembersSpy.mockClear();
            downloadAllMembersSpy.mockResolvedValue(undefined as any);

            listDataSetSpy.mockClear();
            listDataSetSpy.mockResolvedValue(undefined as any);
        });

        it("should handle an error from Download.dataSet", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            downloadDatasetSpy.mockImplementation(async () => {
                throw dummyError;
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPS] as any);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeInstanceOf(ImperativeError);
            expect(caughtError.message).toBe("Failed to download TEST.PS.DATA.SET");
            expect(caughtError.causeErrors).toEqual(dummyError);

            expect(downloadDatasetSpy).toHaveBeenCalledTimes(1);
            expect(downloadDatasetSpy).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {
                directory: undefined,
                extension: undefined,
                file: `${dataSetPS.dsname.toLocaleLowerCase()}.txt`
            });
        });

        it("should handle an error from Download.allMembers", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            downloadAllMembersSpy.mockImplementation(async () => {
                throw dummyError;
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPO] as any);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeInstanceOf(ImperativeError);
            expect(caughtError.message).toBe("Failed to download TEST.PO.DATA.SET");
            expect(caughtError.causeErrors).toEqual(dummyError);

            expect(downloadAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(downloadAllMembersSpy).toHaveBeenCalledWith(dummySession, dataSetPO.dsname, {directory: "test/po/data/set"});
        });

        it("should download all datasets specifying the directory, extension and binary mode", async () => {
            let response;
            let caughtError;

            const directory = "my/test/path";
            const extension = "xyz";
            const binary = true;

            Download.dataSet = jest.fn(async (): Promise<any> => {
                return {
                    commandResponse: "Data set downloaded",
                    apiResponse: {
                        items: [dataSetPS]
                    },
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPS] as any, {directory, extension, binary});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PS.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {directory}),
                apiResponse: [{ ...dataSetPS, status: "Data set downloaded" }]
            });
            expect(Download.dataSet).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {binary, file: "my/test/path/test.ps.data.set.xyz"});
        });

        it("should download all datasets specifying preserveOriginalLetterCase", async () => {
            let response;
            let caughtError;

            Download.dataSet = jest.fn(async (): Promise<any> => {
                return {
                    commandResponse: "Data set downloaded",
                    apiResponse: {
                        items: [dataSetPS]
                    },
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPS] as any, { preserveOriginalLetterCase: true });
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PS.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [{ ...dataSetPS, status: "Data set downloaded" }]
            });
            expect(Download.dataSet).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {
                file: "TEST.PS.DATA.SET.txt",
                preserveOriginalLetterCase: true
            });
        });

        it("should download all datasets specifying the extension", async () => {
            let response;
            let caughtError;

            const extension = "xyz";

            Download.dataSet = jest.fn(async (): Promise<any> => {
                return {
                    commandResponse: "Data set downloaded",
                    apiResponse: {
                        items: [dataSetPS]
                    },
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPS] as any, {extension});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PS.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [{ ...dataSetPS, status: "Data set downloaded" }]
            });
            expect(Download.dataSet).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {file: "test.ps.data.set.xyz"});
        });

        it("should download all datasets with maxConcurrentRequests set to zero", async () => {
            let response;
            let caughtError;

            const maxConcurrentRequests = 0;

            Download.dataSet = jest.fn(async (): Promise<any> => {
                return {
                    commandResponse: "Data set downloaded",
                    apiResponse: {
                        items: [dataSetPS]
                    },
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPS] as any, {maxConcurrentRequests});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PS.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [{ ...dataSetPS, status: "Data set downloaded" }]
            });
            expect(Download.dataSet).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {file: "test.ps.data.set.txt", maxConcurrentRequests: 0});
        });

        it("should download all datasets while specifying an extension with a leading dot", async () => {
            let response;
            let caughtError;

            const directory = "my/test/path";
            const extension = ".xyz";

            Download.dataSet = jest.fn(async (): Promise<any> => {
                return {
                    commandResponse: "Data set downloaded",
                    apiResponse: {
                        items: [dataSetPS]
                    },
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPS] as any, {directory, extension});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PS.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {directory}),
                apiResponse: [{ ...dataSetPS, status: "Data set downloaded" }]
            });
            expect(Download.dataSet).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {file: "my/test/path/test.ps.data.set.xyz"});
        });

        it("should download all datasets specifying the directory and extension map 1", async () => {
            let response;
            let caughtError;

            const directory = "my/test/path";
            const extensionMap = {set: "file"};

            Download.dataSet = jest.fn(async (): Promise<any> => {
                return {
                    commandResponse: "Data set downloaded",
                    apiResponse: {
                        items: [dataSetPS]
                    },
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPS] as any, {directory, extensionMap});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PS.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {directory}),
                apiResponse: [{ ...dataSetPS, status: "Data set downloaded" }]
            });
            expect(Download.dataSet).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {extensionMap, file: "my/test/path/test.ps.data.set.file"});
        });

        it("should download all datasets specifying the directory and extension map 2", async () => {
            let response;
            let caughtError;

            const directory = "my/test/path";
            const extensionMap = {fake: "file"};

            Download.dataSet = jest.fn(async (): Promise<any> => {
                return {
                    commandResponse: "Data set downloaded",
                    apiResponse: {
                        items: [dataSetPS]
                    },
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPS] as any, {directory, extensionMap});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PS.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {directory}),
                apiResponse: [{ ...dataSetPS, status: "Data set downloaded" }]
            });
            expect(Download.dataSet).toHaveBeenCalledWith(dummySession, dataSetPS.dsname, {extensionMap, file: "my/test/path/test.ps.data.set.txt"});
        });

        it("should download all datasets without any options", async () => {
            let response;
            let caughtError;

            try {
                response = await Download.allDataSets(dummySession, [dataSetPS] as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PS.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [{ ...dataSetPS, status: "Data set downloaded" }]
            });
        });

        it("should not download datasets when pattern does not match any", async () => {
            let response;
            let caughtError;

            try {
                response = await Download.allDataSets(dummySession, []);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDataSets.message);
        });

        it("should not download datasets when pattern matches only datasets which failed to list attributes", async () => {
            let response;
            let caughtError;

            Download.dataSet = jest.fn();

            try {
                response = await Download.allDataSets(dummySession, [{
                    dsname: dataSetPO.dsname,
                    error: new Error("i haz bad data set")
                }, dataSetPS] as any);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.failedToDownloadDataSets.message);
            expect(Download.dataSet).toHaveBeenCalledTimes(0);
        });

        it("should not download datasets when pattern matches only archived datasets", async () => {
            let response;
            let caughtError;

            try {
                response = await Download.allDataSets(dummySession, [{ dsname: dataSetPS.dsname }] as any);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.failedToDownloadDataSets.message);
        });

        it("should not download datasets when pattern matches only unsupported datasets", async () => {
            let response;
            let caughtError;

            try {
                response = await Download.allDataSets(dummySession, [{
                    dsname: "TEST.DATA.SET",
                    dsorg: "unknown"
                }] as any);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.failedToDownloadDataSets.message);
        });

        it("should download datasets when pattern matches only datasets which failed to list attributes and failFast is false", async () => {
            const fakeError = new Error("i haz bad data set");
            let response;
            let caughtError;

            Download.dataSet = jest.fn(async (): Promise<any> => {
                return {
                    commandResponse: "Data set downloaded",
                    apiResponse: {
                        items: [dataSetPS]
                    },
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [{
                    dsname: dataSetPO.dsname,
                    error: fakeError
                }, dataSetPS] as any, { failFast: false });
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.datasetDownloadFailed.message);
            expect(caughtError.message).toContain(dataSetPO.dsname);
            expect(Download.dataSet).toHaveBeenCalledTimes(1);
        });

        it("should download datasets when pattern matches only archived datasets and failFast is false", async () => {
            let response;
            let caughtError;

            try {
                response = await Download.allDataSets(dummySession, [{
                    dsname: dataSetPS.dsname,
                    vol: "MIGRATC"
                }] as any, { failFast: false });
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: false,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: [],
                    failedArchived: ["TEST.PS.DATA.SET"],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, { failFast: false }),
                apiResponse: [{
                    dsname: "TEST.PS.DATA.SET",
                    vol: "MIGRATC",
                    status: "Skipped: Archived data set or alias - type MIGRATC."
                }],
                errorMessage: ZosFilesMessages.someDownloadsFailed.message
            });
        });

        it("should download datasets when pattern matches only unsupported datasets and failFast is false", async () => {
            let response;
            let caughtError;

            try {
                response = await Download.allDataSets(dummySession, [{
                    dsname: "TEST.DATA.SET",
                    dsorg: "unknown"
                }] as any, { failFast: false });
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: false,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: [],
                    failedArchived: [],
                    failedUnsupported: ["TEST.DATA.SET"],
                    failedWithErrors: {}
                }, { failFast: false }),
                apiResponse: [{
                    dsname: "TEST.DATA.SET",
                    dsorg: "unknown",
                    status: "Skipped: Unsupported data set - type unknown."
                }],
                errorMessage: ZosFilesMessages.someDownloadsFailed.message
            });
        });

        it("should download datasets when pattern matches a partitioned dataset", async () => {
            let response;
            let caughtError;

            downloadAllMembersSpy.mockImplementation(async (): Promise<any> => {
                return {
                    apiResponse: {
                        items: [
                            { member: "TESTDS" }
                        ]
                    },
                    commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, "./")
                };
            });

            List.allMembers = jest.fn(async (): Promise<any> => {
                return {
                    apiResponse: {
                        items: [
                            { member: "TESTDS" }
                        ]
                    }
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPO] as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PO.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [{
                    ...dataSetPO,
                    status: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, "./") + "\nMembers:  TESTDS;"
                }]
            });
        });

        it("should download datasets when pattern matches a partitioned dataset with no members", async () => {
            let response;
            let caughtError;

            createDirsSpy.mockClear();
            downloadAllMembersSpy.mockImplementation(async (): Promise<any> => {
                return {
                    apiResponse: {
                        items: []
                    },
                    commandResponse: ZosFilesMessages.noMembersFound.message
                };
            });

            List.allMembers = jest.fn(async (): Promise<any> => {
                return {
                    apiResponse: {
                        items: []
                    }
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPO] as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PO.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [{
                    ...dataSetPO,
                    status: ZosFilesMessages.noMembersFound.message
                }]
            });
            expect(createDirsSpy).toHaveBeenCalledTimes(1);
            expect(createDirsSpy).toHaveBeenCalledWith("test/po/data/set");
        });

        it("should download datasets when pattern matches a partitioned dataset and directory is supplied", async () => {
            let response;
            let caughtError;
            const directory = "my/test/path/";

            downloadAllMembersSpy.mockImplementation(async (): Promise<any> => {
                return {
                    apiResponse: {
                        items: [
                            { member: "TESTDS" }
                        ]
                    },
                    commandResponse: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, directory)
                };
            });

            List.allMembers = jest.fn(async (): Promise<any> => {
                return {
                    apiResponse: {
                        items: [
                            { member: "TESTDS" }
                        ]
                    }
                };
            });

            try {
                response = await Download.allDataSets(dummySession, [dataSetPO] as any, {directory});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadDsmResponse({
                    downloaded: ["TEST.PO.DATA.SET"],
                    failedArchived: [],
                    failedUnsupported: [],
                    failedWithErrors: {}
                }, {directory}),
                apiResponse: [{
                    ...dataSetPO,
                    status: util.format(ZosFilesMessages.datasetDownloadedWithDestination.message, directory) + "\nMembers:  TESTDS;"
                }]
            });
        });
    });

    describe("USS File", () => {
        const zosmfStreamSpy = jest.spyOn(ZosmfRestClient, "getStreamed");
        const zosmfExpectBufferSpy = jest.spyOn(ZosmfRestClient, "getExpectBuffer");
        const ioCreateDirSpy = jest.spyOn(IO, "createDirsSyncFromFilePath");
        const ioWriteStreamSpy = jest.spyOn(IO, "createWriteStream");
        const fakeStream: any = {fakeStream: true};
        const zosmfGetFullSpy = jest.spyOn(ZosmfRestClient, "getExpectFullResponse");
        const putUSSPayloadSpy = jest.spyOn(Utilities, "putUSSPayload");
        const fakeResponseWithEtag = {
            data: Buffer.from(ussFileContent),
            response: { headers: { etag: etagValue } }
        };

        beforeEach(() => {
            zosmfStreamSpy.mockClear();
            zosmfStreamSpy.mockImplementation(async () => ussFileContent);

            zosmfGetFullSpy.mockClear();
            zosmfGetFullSpy.mockImplementation(async (): Promise<any> => ussFileContent);

            zosmfExpectBufferSpy.mockClear();
            zosmfExpectBufferSpy.mockImplementation(async () => Buffer.from(ussFileContent));

            ioCreateDirSpy.mockClear();
            ioCreateDirSpy.mockImplementation(() => null);

            ioWriteStreamSpy.mockClear();
            ioWriteStreamSpy.mockImplementation(() => fakeStream);

            putUSSPayloadSpy.mockClear();
            putUSSPayloadSpy.mockResolvedValue(Buffer.from("{}"));
        });

        it("should throw an error if the data set name is not specified", async () => {
            let response;
            let caughtError;

            // Test for NULL
            try {
                response = await (Download as any).ussFile(dummySession, null);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);

            caughtError = undefined;
            // Test for UNDEFINED
            try {
                response = await (Download as any).ussFile(dummySession, undefined);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);

            caughtError = undefined;
            // Test for EMPTY
            try {
                response = await (Download as any).ussFile(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should throw an error if the requested USS file data type is record", async () => {
            let response;
            let caughtError;

            try {
                response = await Download.ussFile(dummySession, ussname, {record: true});
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.unsupportedDataType.message);
        });

        it("should download uss file", async () => {
            let response;
            let caughtError;
            const destination = localFileName;
            try {
                response = await Download.ussFile(dummySession, ussname);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(ussname.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            // expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, endpoint, [], fakeStream, true, undefined);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeStream,
                normalizeResponseNewLines: true
            });

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(destination);
        });

        it("should download uss file in binary mode", async () => {
            let response;
            let caughtError;
            const destination = localFileName;
            try {
                response = await Download.ussFile(dummySession, ussname, {binary: true});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(ussname.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            // expect(zosmfStreamSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_BINARY], fakeStream,
            //     false, /* don't normalize new lines in binary*/
            //     undefined /* no progress task */);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                // TODO:gzip
                // reqHeaders: [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING],
                reqHeaders: [ZosmfHeaders.X_IBM_BINARY],
                responseStream: fakeStream,
                normalizeResponseNewLines: false, /* don't normalize new lines in binary*/
                task: undefined /* no progress task */});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(destination);
        });

        it("should download uss file with encoding mode", async () => {
            let response;
            let caughtError;
            const destination = localFileName;
            try {
                response = await Download.ussFile(dummySession, ussname, { encoding: "285" });
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(ussname.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {
                resource: endpoint,
                reqHeaders: [{ "X-IBM-Data-Type": "text;fileEncoding=285" }, ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeStream,
                normalizeResponseNewLines: true,
                task: undefined /* no progress task */
            });

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(destination);
        });

        it("should download ISO8859-1 uss file in binary mode", async () => {
            let response;
            let caughtError;
            const destination = localFileName;
            putUSSPayloadSpy.mockResolvedValueOnce(Buffer.from(JSON.stringify({
                stdout: ["t ISO8859-1\tT=on\t" + ussname]
            })));
            try {
                response = await Download.ussFile(dummySession, ussname, {});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(ussname.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            // expect(zosmfStreamSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_BINARY], fakeStream,
            //     false, /* don't normalize new lines in binary*/
            //     undefined /* no progress task */);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                // TODO:gzip
                // reqHeaders: [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING],
                reqHeaders: [ZosmfHeaders.X_IBM_BINARY],
                responseStream: fakeStream,
                normalizeResponseNewLines: false, /* don't normalize new lines in binary*/
                task: undefined /* no progress task */});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(destination);
        });

        it("should download IBM-1147 uss file with encoding mode", async () => {
            let response;
            let caughtError;
            const destination = localFileName;
            putUSSPayloadSpy.mockResolvedValueOnce(Buffer.from(JSON.stringify({
                stdout: ["t IBM-1147\tT=on\t" + ussname]
            })));
            try {
                response = await Download.ussFile(dummySession, ussname, {});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(ussname.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {
                resource: endpoint,
                reqHeaders: [{ "X-IBM-Data-Type": "text;fileEncoding=IBM-1147" }, ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeStream,
                normalizeResponseNewLines: true,
                task: undefined /* no progress task */
            });

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(destination);
        });

        it("should download uss file using responseTimeout", async () => {
            let response;
            let caughtError;
            const destination = localFileName;
            const responseTimeout = 5;
            try {
                response = await Download.ussFile(dummySession, ussname, {responseTimeout});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(ussname.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedWithDestination.message, destination),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, { "X-IBM-Response-Timeout": "5" }, ZosmfHeaders.TEXT_PLAIN],
                responseStream: fakeStream,
                normalizeResponseNewLines: true,
                task: undefined /* no progress task */});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(destination);
        });

        it("should download uss file content to a local file in binary mode", async () => {
            let response;
            let caughtError;
            const file = "a/xyz/test.txt";
            try {
                response = await Download.ussFile(dummySession, ussname, {file, binary: true});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(ussname.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedWithDestination.message, file),
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                // TODO:gzip
                // reqHeaders: [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING],
                reqHeaders: [ZosmfHeaders.X_IBM_BINARY],
                responseStream: fakeStream,
                normalizeResponseNewLines: false, /* don't normalize new lines in binary */
                task: undefined /* no progress task */});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(file);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(file);
        });

        it("should download uss file and return Etag", async () => {
            zosmfGetFullSpy.mockImplementationOnce(async () => fakeResponseWithEtag);
            let response;
            let caughtError;
            const destination = localFileName;
            try {
                response = await Download.ussFile(dummySession, ussname, {returnEtag: true});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(ussname.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedWithDestination.message, destination),
                apiResponse: {etag: etagValue}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN, ZosmfHeaders.X_IBM_RETURN_ETAG],
                responseStream: fakeStream,
                normalizeResponseNewLines: true,
                dataToReturn: [CLIENT_PROPERTY.response]});

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteStreamSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteStreamSpy).toHaveBeenCalledWith(destination);
        });

        it("should download uss file to a stream", async () => {
            let response;
            let caughtError;
            const responseStream = new PassThrough();

            try {
                response = await Download.ussFile(dummySession, ussname, { stream: responseStream });
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodeURIComponent(ussname.substr(1)));

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.ussFileDownloadedSuccessfully.message,
                apiResponse: {}
            });

            expect(zosmfGetFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfGetFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders: [ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.TEXT_PLAIN],
                responseStream,
                normalizeResponseNewLines: true,
                task: undefined /* no progress task */});

            expect(ioCreateDirSpy).not.toHaveBeenCalled();
            expect(ioWriteStreamSpy).not.toHaveBeenCalled();
        });
    });

    describe("USS Directory", () => {
        const ussDirName = "/u/test";
        const fakeFileResponse = { status: "downloaded file" };
        const listFileListSpy = jest.spyOn(List, "fileList");
        const downloadUssFileSpy = jest.spyOn(Download, "ussFile");
        const mkdirPromiseSpy = jest.spyOn(fs.promises, "mkdir");
        const existsSyncSpy = jest.spyOn(fs, "existsSync");

        beforeEach(() => {
            existsSyncSpy.mockClear();
            listFileListSpy.mockClear();

            downloadUssFileSpy.mockClear();
            downloadUssFileSpy.mockResolvedValue(fakeFileResponse as any);

            mkdirPromiseSpy.mockClear();
            mkdirPromiseSpy.mockResolvedValue(undefined as any);
        });

        it("should handle an error from create file promise", async () => {
            let response;
            let caughtError;

            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "-", name: "file1" }
                    ]
                }
            } as any);
            const dummyError = new Error("test");
            downloadUssFileSpy.mockImplementation(async () => {
                throw dummyError;
            });

            try {
                response = await Download.ussDir(dummySession, ussDirName);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeInstanceOf(ImperativeError);
            expect(caughtError.message).toBe("Failed to download file1");
            expect(caughtError.causeErrors).toEqual(dummyError);

            expect(downloadUssFileSpy).toHaveBeenCalledTimes(1);
            expect(downloadUssFileSpy).toHaveBeenCalledWith(dummySession, ussDirName + "/file1", {
                file: join(process.cwd(), "file1")
            });
        });

        it("should handle an error from create directory promise", async () => {
            let response;
            let caughtError;

            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "d", name: "folder1" }
                    ]
                }
            } as any);
            const dummyError = new Error("test");
            mkdirPromiseSpy.mockImplementation(async () => {
                throw dummyError;
            });

            try {
                response = await Download.ussDir(dummySession, ussDirName);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeInstanceOf(ImperativeError);
            expect(caughtError.message).toBe("Failed to create directory folder1");
            expect(caughtError.causeErrors).toEqual(dummyError);

            expect(mkdirPromiseSpy).toHaveBeenCalledTimes(1);
            expect(mkdirPromiseSpy).toHaveBeenCalledWith(join(process.cwd(), "folder1"), { recursive: true });
        });

        it("should download USS directory with download and list options", async () => {
            const fileOptions: IDownloadOptions = { binary: true };
            const listOptions: IUSSListOptions = { filesys: true };
            let response;
            let caughtError;

            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "-", name: "file1" }
                    ]
                }
            } as any);

            try {
                response = await Download.ussDir(dummySession, ussDirName, fileOptions, listOptions);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadUssDirResponse({
                    downloaded: ["file1"],
                    skippedExisting: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [fakeFileResponse]
            });
            expect(List.fileList).toHaveBeenCalledWith(dummySession, ussDirName,
                { name: "*", ...listOptions });
            expect(Download.ussFile).toHaveBeenCalledWith(dummySession, ussDirName + "/file1",
                { file: join(process.cwd(), "file1"), ...fileOptions });
        });

        it("should download USS directory when failFast is false", async () => {
            let response;
            let caughtError;

            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "d", name: "badfolder" },
                        { mode: "-", name: "badfile" },
                        { mode: "d", name: "goodfolder" },
                        { mode: "-", name: "goodfile" }
                    ]
                }
            } as any);
            const dummyError = new Error("test");
            downloadUssFileSpy.mockImplementationOnce(async () => {
                throw dummyError;
            });
            mkdirPromiseSpy.mockImplementationOnce(async () => {
                throw dummyError;
            });

            try {
                response = await Download.ussDir(dummySession, ussDirName, { failFast: false });
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: false,
                commandResponse: (Download as any).buildDownloadUssDirResponse({
                    downloaded: ["goodfolder", "goodfile"],
                    skippedExisting: [],
                    failedWithErrors: { "badfolder": dummyError, "badfile": dummyError }
                }, { failFast: false }),
                apiResponse: [fakeFileResponse]
            });
        });

        it("should download USS directory with maxConcurrentRequests set to zero", async () => {
            const maxConcurrentRequests = 0;
            let response;
            let caughtError;

            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "-", name: "file1" }
                    ]
                }
            } as any);

            try {
                response = await Download.ussDir(dummySession, ussDirName, { maxConcurrentRequests });
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadUssDirResponse({
                    downloaded: ["file1"],
                    skippedExisting: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [fakeFileResponse]
            });
            expect(Download.ussFile).toHaveBeenCalledWith(dummySession, ussDirName + "/file1",
                { file: join(process.cwd(), "file1"), maxConcurrentRequests: 0 });
        });

        it("should download USS directory excluding hidden files", async () => {
            let response;
            let caughtError;

            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "d", name: ".." },
                        { mode: "d", name: "." },
                        { mode: "-", name: "file1" },
                        { mode: "-", name: "file2" },
                        { mode: "d", name: ".folder" },
                        { mode: "-", name: ".folder/file3" }
                    ]
                }
            } as any);

            try {
                response = await Download.ussDir(dummySession, ussDirName);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadUssDirResponse({
                    downloaded: ["file1", "file2"],
                    skippedExisting: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [fakeFileResponse, fakeFileResponse]
            });
            expect(fs.promises.mkdir).toHaveBeenCalledTimes(0);
            expect(Download.ussFile).toHaveBeenCalledTimes(2);
        });

        it("should download USS directory when includeHidden is true", async () => {
            let response;
            let caughtError;

            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "d", name: ".." },
                        { mode: "d", name: "." },
                        { mode: "-", name: "file1" },
                        { mode: "-", name: "file2" },
                        { mode: "d", name: ".folder" },
                        { mode: "-", name: ".folder/file3" }
                    ]
                }
            } as any);

            try {
                response = await Download.ussDir(dummySession, ussDirName, { includeHidden: true });
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadUssDirResponse({
                    downloaded: ["file1", "file2", ".folder", ".folder/file3"],
                    skippedExisting: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [fakeFileResponse, fakeFileResponse, fakeFileResponse]
            });
            expect(fs.promises.mkdir).toHaveBeenCalledTimes(1);
            expect(Download.ussFile).toHaveBeenCalledTimes(3);
        });

        it("should download USS directory with .zosattributes file", async () => {
            let response;
            let caughtError;

            const zosAttributes: Partial<ZosFilesAttributes> = {
                fileShouldBeIgnored: (name: string) => name.startsWith("ignored"),
                getFileTransferMode: (name: string) => name.startsWith("binary") ? TransferMode.BINARY : TransferMode.TEXT,
                getLocalEncoding: (name: string): any => name.startsWith("text") ? "ISO-8859-1" : null,
                getRemoteEncoding: (name: string): any => name.startsWith("text") ? "IBM-1047" : null
            };
            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "d", name: ".." },
                        { mode: "d", name: "." },
                        { mode: "-", name: "binaryfile" },
                        { mode: "-", name: "ignoredfile" },
                        { mode: "-", name: "textfile" },
                    ]
                }
            } as any);

            try {
                response = await Download.ussDir(dummySession, ussDirName, { attributes: zosAttributes as any });
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadUssDirResponse({
                    downloaded: ["binaryfile", "textfile"],
                    skippedExisting: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [fakeFileResponse, fakeFileResponse]
            });
            expect(Download.ussFile).toHaveBeenNthCalledWith(1, dummySession, ussDirName + "/binaryfile",
                expect.objectContaining({ binary: true }));
            expect(Download.ussFile).toHaveBeenNthCalledWith(2, dummySession, ussDirName + "/textfile",
                expect.objectContaining({ encoding: "IBM-1047", localEncoding: "ISO-8859-1" }));
        });

        it("should not download files that already exist locally", async () => {
            let response;
            let caughtError;

            existsSyncSpy.mockImplementation((filepath) => path.basename(filepath.toString()) === "file2" );
            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "-", name: "file1" },
                        { mode: "-", name: "file2" },
                    ]
                }
            } as any);

            try {
                response = await Download.ussDir(dummySession, ussDirName);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadUssDirResponse({
                    downloaded: ["file1"],
                    skippedExisting: ["file2"],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [fakeFileResponse]
            });
            expect(Download.ussFile).toHaveBeenCalledTimes(1);
        });

        it("should download files that already exist locally when overwrite is true", async () => {
            let response;
            let caughtError;

            existsSyncSpy.mockImplementation((filepath) => path.basename(filepath.toString()) === "file2" );
            listFileListSpy.mockResolvedValueOnce({
                apiResponse: {
                    items: [
                        { mode: "-", name: "file1" },
                        { mode: "-", name: "file2" },
                    ]
                }
            } as any);

            try {
                response = await Download.ussDir(dummySession, ussDirName, {overwrite: true});
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: (Download as any).buildDownloadUssDirResponse({
                    downloaded: ["file1", "file2"],
                    skippedExisting: [],
                    failedWithErrors: {}
                }, {}),
                apiResponse: [fakeFileResponse, fakeFileResponse]
            });
            expect(Download.ussFile).toHaveBeenCalledTimes(2);
        });

        // TODO should download a uss file to a stream
    });

    describe("buildDownloadDsmResponse", () => {
        it("should build response with data sets that downloaded successfully", () => {
            const result: IDownloadDsmResult = (Download as any).emptyDownloadDsmResult();
            result.downloaded = ["HLQ.DS.TEST"];
            const response: string = (Download as any).buildDownloadDsmResponse(result, {});
            expect(response).toContain("1 data set(s) downloaded successfully");
            expect(response).not.toContain("1 data set(s) failed to download");
        });

        it("should build response with data sets skipped because they are archived", () => {
            const result: IDownloadDsmResult = (Download as any).emptyDownloadDsmResult();
            result.failedArchived = ["HLQ.DS.SKIPPED"];
            const response: string = (Download as any).buildDownloadDsmResponse(result, {});
            expect(response).toContain("1 data set(s) failed to download");
            expect(response).toContain("1 failed because they are archived");
        });

        it("should build response with data sets skipped because they are an unsupported type", () => {
            const result: IDownloadDsmResult = (Download as any).emptyDownloadDsmResult();
            result.failedUnsupported = ["HLQ.DS.SKIPPED"];
            const response: string = (Download as any).buildDownloadDsmResponse(result, {});
            expect(response).toContain("1 data set(s) failed to download");
            expect(response).toContain("1 failed because they are an unsupported type");
        });

        it("should build response with data sets that failed to download", () => {
            const errorMsg = "i haz bad data set";
            const result: IDownloadDsmResult = (Download as any).emptyDownloadDsmResult();
            result.failedWithErrors = { "HLQ.DS.FAILED": new Error(errorMsg) };
            const response: string = (Download as any).buildDownloadDsmResponse(result, {});
            expect(response).toContain("1 data set(s) failed to download");
            expect(response).toContain(errorMsg);
            expect(response).toContain("Some data sets may have been skipped because --fail-fast is true");
        });

        it("should build response with data sets that failed to download when failFast is false", () => {
            const errorMsg = "i haz bad data set";
            const result: IDownloadDsmResult = (Download as any).emptyDownloadDsmResult();
            result.failedWithErrors = { "HLQ.DS.FAILED": new Error(errorMsg) };
            const response: string = (Download as any).buildDownloadDsmResponse(result, { failFast: false });
            expect(response).toContain("1 data set(s) failed to download");
            expect(response).toContain(errorMsg);
            expect(response).not.toContain("Some data sets may have been skipped because --fail-fast is true");
        });
    });

    describe("buildDownloadUssDirResponse", () => {
        it("should build response with USS files that downloaded successfully", () => {
            const result: IDownloadDsmResult = (Download as any).emptyDownloadUssDirResult();
            result.downloaded = ["/u/test/file1"];
            const response: string = (Download as any).buildDownloadUssDirResponse(result, {});
            expect(response).toContain("1 file(s) downloaded successfully");
            expect(response).not.toContain("1 file(s) failed to download");
        });

        it("should build response with USS files that failed to download", () => {
            const errorMsg = "i haz bad uss file";
            const result: IDownloadDsmResult = (Download as any).emptyDownloadUssDirResult();
            result.failedWithErrors = { "/u/test/bad1": new Error(errorMsg) };
            const response: string = (Download as any).buildDownloadUssDirResponse(result, {});
            expect(response).toContain("1 file(s) failed to download");
            expect(response).toContain(errorMsg);
            expect(response).toContain("Some files may have been skipped because --fail-fast is true");
        });

        it("should build response with USS files that failed to download when failFast is false", () => {
            const errorMsg = "i haz bad uss file";
            const result: IDownloadDsmResult = (Download as any).emptyDownloadUssDirResult();
            result.failedWithErrors = { "/u/test/bad1": new Error(errorMsg) };
            const response: string = (Download as any).buildDownloadUssDirResponse(result, { failFast: false });
            expect(response).toContain("1 file(s) failed to download");
            expect(response).toContain(errorMsg);
            expect(response).not.toContain("Some files may have been skipped because --fail-fast is true");
        });
    });
});
