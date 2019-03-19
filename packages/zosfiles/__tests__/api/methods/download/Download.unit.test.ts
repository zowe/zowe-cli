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

import { IO, Session } from "@brightside/imperative";
import { ZosFilesMessages } from "../../../../";
import { ZosmfHeaders, ZosmfRestClient } from "../../../../../rest";
import { Download } from "../../../../src/api/methods/download/Download";
import { posix } from "path";
import { ZosFilesConstants } from "../../../../src/api/constants/ZosFiles.constants";
import * as util from "util";
import { List } from "../../../../src/api/methods/list";

describe("z/OS Files - Download", () => {
    const dsname = "USER.DATA.SET";
    const dsFolder = "user/data/set";
    const dsContent = Buffer.from("This\nis\r\na\ntest");
    const ussname = "/a/user/test.txt";
    const arrOfUssPath: string[] = ussname.split("/");
    const localFileName = arrOfUssPath[arrOfUssPath.length - 1];
    const ussFileContent = "Test data for unit test";

    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    describe("dataset", () => {
        const zosmfExpectSpy = jest.spyOn(ZosmfRestClient, "getExpectBuffer");
        const ioCreateDirSpy = jest.spyOn(IO, "createDirsSyncFromFilePath");
        const ioWriteFileSpy = jest.spyOn(IO, "writeFile");

        beforeEach(() => {
            zosmfExpectSpy.mockClear();
            zosmfExpectSpy.mockImplementation(() => dsContent);

            ioCreateDirSpy.mockClear();
            ioCreateDirSpy.mockImplementation(() => null);

            ioWriteFileSpy.mockClear();
            ioWriteFileSpy.mockImplementation(() => null);
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
            const newDsContent = IO.processNewlines(dsContent.toString());

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedSuccessfully.message, destination),
                apiResponse: Buffer.from(newDsContent)
            });

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, []);

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteFileSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteFileSpy).toHaveBeenCalledWith(destination, Buffer.from(newDsContent));
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
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedSuccessfully.message, destination),
                apiResponse: Buffer.from(newDsContent)
            });

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, []);

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteFileSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteFileSpy).toHaveBeenCalledWith(destination, Buffer.from(newDsContent));
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
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedSuccessfully.message, destination),
                apiResponse: dsContent
            });

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_BINARY]);

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteFileSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteFileSpy).toHaveBeenCalledWith(destination, Buffer.from(dsContent));
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
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedSuccessfully.message, file),
                apiResponse: dsContent
            });

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_BINARY]);

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(file);

            expect(ioWriteFileSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteFileSpy).toHaveBeenCalledWith(file, Buffer.from(dsContent));
        });

        it("should handle a z/OS MF error", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            zosmfExpectSpy.mockImplementation(() => {
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

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, []);

            expect(ioCreateDirSpy).not.toHaveBeenCalled();
            expect(ioWriteFileSpy).not.toHaveBeenCalled();
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
            listAllMembersSpy.mockImplementation(() => {
                return {apiResponse: listApiResponse};
            });

            downloadDatasetSpy.mockClear();
            downloadDatasetSpy.mockImplementation(() => null);
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

            listAllMembersSpy.mockResolvedValueOnce({apiResponse: {items: []}});

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
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedSuccessfully.message, dsFolder),
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
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedSuccessfully.message, directory),
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
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedSuccessfully.message, directory),
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

        it("should handle an error from the List.allMembers API", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            listAllMembersSpy.mockImplementation(() => {
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
            downloadDatasetSpy.mockImplementation(() => {
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
                file: `${dsFolder}/${firstItem.member.toLowerCase()}.txt`,
            });
        });

    });

    describe("datasetMatchingPattern", () => {
        const listDataSetSpy = jest.spyOn(List, "dataSet");
        const downloadDatasetSpy = jest.spyOn(Download, "dataSet");
        const downloadAllMembersSpy = jest.spyOn(Download, "allMembers");

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
            downloadDatasetSpy.mockImplementation(() => null);

            downloadAllMembersSpy.mockClear();
            downloadAllMembersSpy.mockImplementation(() => null);

            listDataSetSpy.mockClear();
            listDataSetSpy.mockImplementation(() => null);
        });

    });

    describe("USS File", () => {
        const zosmfExpectSpy = jest.spyOn(ZosmfRestClient, "getExpectString");
        const zosmfExpectBufferSpy = jest.spyOn(ZosmfRestClient, "getExpectBuffer");
        const ioCreateDirSpy = jest.spyOn(IO, "createDirsSyncFromFilePath");
        const ioWriteFileSpy = jest.spyOn(IO, "writeFile");

        beforeEach(() => {
            zosmfExpectSpy.mockClear();
            zosmfExpectSpy.mockImplementation(() => ussFileContent);

            zosmfExpectBufferSpy.mockClear();
            zosmfExpectBufferSpy.mockImplementation(() => ussFileContent);

            ioCreateDirSpy.mockClear();
            ioCreateDirSpy.mockImplementation(() => null);

            ioWriteFileSpy.mockClear();
            ioWriteFileSpy.mockImplementation(() => null);
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
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedSuccessfully.message, destination),
                apiResponse: Buffer.from(ussFileContent)
            });

            expect(zosmfExpectBufferSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectBufferSpy).toHaveBeenCalledWith(dummySession, endpoint, []);

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteFileSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteFileSpy).toHaveBeenCalledWith(destination, Buffer.from(ussFileContent));
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
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedSuccessfully.message, destination),
                apiResponse: ussFileContent
            });

            expect(zosmfExpectBufferSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectBufferSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_BINARY]);

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(destination);

            expect(ioWriteFileSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteFileSpy).toHaveBeenCalledWith(destination, Buffer.from(ussFileContent));
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
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedSuccessfully.message, file),
                apiResponse: ussFileContent
            });

            expect(zosmfExpectBufferSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectBufferSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_BINARY]);

            expect(ioCreateDirSpy).toHaveBeenCalledTimes(1);
            expect(ioCreateDirSpy).toHaveBeenCalledWith(file);

            expect(ioWriteFileSpy).toHaveBeenCalledTimes(1);
            expect(ioWriteFileSpy).toHaveBeenCalledWith(file, Buffer.from(ussFileContent));
        });
    });
});
