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

jest.mock("fs");

import * as path from "path";
import * as fs from "fs";

import { ImperativeError, IO, Session } from "@brightside/imperative";
import { ZosFilesMessages } from "../../../../";
import { ZosmfHeaders, ZosmfRestClient } from "../../../../../rest";
import { IZosFilesResponse } from "../../../../../zosfiles";
import { ZosFilesConstants } from "../../../../src/api/constants/ZosFiles.constants";
import { IUploadOptions } from "../../../../src/api/methods/upload/doc/IUploadOptions";
import { Upload } from "../../../../src/api/methods/upload/Upload";
import { List } from "../../../../src/api/methods/list/List";
import { ZosFilesUtils } from "../../../../src/api/utils/ZosFilesUtils";
import { stripNewLines } from "../../../../../../__tests__/__src__/TestUtils";
import { Create } from "../../../../src/api/methods/create";

describe("z/OS Files - Upload", () => {

    const dsName = "UNIT.TEST";
    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    let response: IZosFilesResponse;
    let error: any;

    describe("fileToDataset", () => {
        const dataSetSpy = jest.spyOn(Upload as any, "pathToDataSet");
        const lsStatSpy = jest.spyOn(fs, "lstat");

        beforeEach(() => {
            response = undefined;
            error = undefined;
            dataSetSpy.mockClear();
            lsStatSpy.mockClear();
        });

        it("should throw error if file path is not specified", async () => {
            try {
                response = await Upload.fileToDataset(dummySession, undefined, dsName);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputFile.message);
        });
        it("should throw error if data set name is not specified", async () => {
            const testPath = "test.path";
            try {
                response = await Upload.fileToDataset(dummySession, testPath, undefined);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });
        it("should throw error if invalid file path is specified", async () => {
            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(null, { isFile: () => false });
            });
            const testPath = "non-existing-path";
            try {
                response = await Upload.fileToDataset(dummySession, testPath, dsName);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputFile.message);
        });

        it("should throw underlying fs error", async () => {
            const rootError = {
                code: "test",
                toString() {
                    return this.code;
                }
            };

            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(rootError);
            });
            const testPath = "non-existing-path";
            try {
                response = await Upload.fileToDataset(dummySession, testPath, dsName);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.nodeJsFsError.message);
            expect(error.additionalDetails).toEqual(rootError.toString());
            expect(error.causeErrors).toBe(rootError);
        });

        it("return with proper response", async () => {
            const testReturn = {};
            const testPath = "test/path";
            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(null, { isFile: () => true });
            });

            dataSetSpy.mockReturnValueOnce(testReturn);

            try {
                response = await Upload.fileToDataset(dummySession, testPath, dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(dataSetSpy).toHaveBeenCalledTimes(1);
            expect(dataSetSpy).toHaveBeenLastCalledWith(dummySession, testPath, dsName, {});
        });
    });

    describe("dirToPds", () => {
        const isDirSpy = jest.spyOn(IO, "isDir");
        const dataSetSpy = jest.spyOn(Upload as any, "pathToDataSet");
        const lsStatSpy = jest.spyOn(fs, "lstat");

        beforeEach(() => {
            response = undefined;
            error = undefined;
            isDirSpy.mockClear();
            dataSetSpy.mockClear();
        });

        it("should throw error if directory path is not specified", async () => {
            try {
                response = await Upload.dirToPds(dummySession, undefined, dsName);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputDir.message);
        });
        it("should throw error if PDS name is not specified", async () => {
            const testDir = "path/to/a/file";
            const dsname = "TEST.DSN";
            try {
                response = await Upload.dirToPds(dummySession, testDir, undefined);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should throw underlying fs error", async () => {
            const rootError = {
                code: "test",
                toString() {
                    return this.code;
                }
            };

            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(rootError);
            });

            const testDir = "path/to/a/file";
            const dsname = "TEST.DSN";
            try {
                response = await Upload.dirToPds(dummySession, testDir, dsname);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.nodeJsFsError.message);
            expect(error.additionalDetails).toEqual(rootError.toString());
            expect(error.causeErrors).toBe(rootError);
        });

        it("return with proper message when path is pointing to a file", async () => {
            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(null, { isFile: () => false });
            });
            isDirSpy.mockReturnValueOnce(false);
            const testPath = "test/path";

            try {
                response = await Upload.dirToPds(dummySession, testPath, dsName);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputDir.message);
        });
        it("return with proper response", async () => {
            const testReturn = {};
            const testPath = "test/path";
            isDirSpy.mockReturnValueOnce(true);
            dataSetSpy.mockReturnValueOnce(testReturn);
            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(null, { isFile: () => false });
            });

            try {
                response = await Upload.dirToPds(dummySession, testPath, dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(dataSetSpy).toHaveBeenCalledTimes(1);
            expect(dataSetSpy).toHaveBeenLastCalledWith(dummySession, testPath, dsName, {});
        });
    });

    describe("bufferToDataSet", () => {
        const zosmfExpectSpy = jest.spyOn(ZosmfRestClient, "putExpectString");

        beforeEach(() => {
            response = undefined;
            error = undefined;
            zosmfExpectSpy.mockClear();
            zosmfExpectSpy.mockImplementation(() => null);
        });

        it("should throw error if data set name is not specified", async () => {
            try {
                response = await Upload.bufferToDataSet(dummySession, Buffer.from("testing"), undefined);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });
        it("return error that throw by the ZosmfRestClient", async () => {
            const buffer: Buffer = Buffer.from("testing");
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsName);
            const options = [ZosmfHeaders.X_IBM_TEXT];
            const testError = new ImperativeError({
                msg: "test error"
            });

            zosmfExpectSpy.mockRejectedValueOnce(testError);

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error).toBe(testError);
        });
        it("return with proper response when upload buffer to a data set", async () => {
            const buffer: Buffer = Buffer.from("testing");
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsName);
            const options = [ZosmfHeaders.X_IBM_TEXT];

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, options, buffer);
        });
        it("return with proper response when upload buffer to a PDS member", async () => {
            const buffer: Buffer = Buffer.from("testing");
            const testDsName = `${dsName}(member)`;
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, testDsName);
            const options = [ZosmfHeaders.X_IBM_TEXT];

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, testDsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, options, buffer);
        });
        it("return with proper response when upload buffer to a data set with optional parameters", async () => {
            const buffer: Buffer = Buffer.from("testing");
            const uploadOptions: IUploadOptions = {
                binary: true
            };
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsName);
            let options = [ZosmfHeaders.X_IBM_BINARY];

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, options, buffer);
            zosmfExpectSpy.mockClear();

            // Unit test for wait option
            uploadOptions.recall = "wait";
            options = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.X_IBM_MIGRATED_RECALL_WAIT];

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, options, buffer);
            zosmfExpectSpy.mockClear();

            // Unit test for no wait option
            uploadOptions.recall = "nowait";
            options = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT];

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, options, buffer);
            zosmfExpectSpy.mockClear();

            // Unit test for no error option
            uploadOptions.recall = "error";
            options = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.X_IBM_MIGRATED_RECALL_ERROR];

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, options, buffer);
            zosmfExpectSpy.mockClear();

            // Unit test default value
            uploadOptions.recall = "non-existing";
            options = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT];

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, options, buffer);
        });
        it("return with proper response when upload dataset with specify volume option", async () => {
            const buffer: Buffer = Buffer.from("testing");
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(TEST)`, dsName);
            const options = [ZosmfHeaders.X_IBM_TEXT];
            const uploadOptions: IUploadOptions = {
                volume: "TEST"
            };
            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, options, buffer);
        });
    });

    describe("pathToDataSet", () => {
        const listDatasetSpy = jest.spyOn(List, "dataSet");
        const getFileListSpy = jest.spyOn(ZosFilesUtils, "getFileListFromPath");
        const readFileSpy = jest.spyOn(fs, "readFileSync");
        const writeZosmfDatasetSpy = jest.spyOn(Upload, "bufferToDataSet");
        const isDirSpy = jest.spyOn(IO, "isDir");

        beforeEach(() => {
            response = undefined;
            error = undefined;
            listDatasetSpy.mockClear();
            getFileListSpy.mockClear();
            readFileSpy.mockClear();
            readFileSpy.mockReturnValue(Buffer.from("buffer"));
            writeZosmfDatasetSpy.mockClear();
            writeZosmfDatasetSpy.mockReset();
            isDirSpy.mockClear();
        });

        it("should throw error when inputPath is not defined", async () => {
            try {
                response = await Upload.pathToDataSet(dummySession, undefined, dsName);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
        });
        it("should throw error when dataSet name is not defined", async () => {
            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", undefined);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", "");
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });
        it("should throw error when dataSet name contain masking character", async () => {
            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", "TESTING%");
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.unsupportedMaskingInDataSetName.message);
        });
        it("should throw error when List.dataSet failed", async () => {
            const mockFileList = ["file1"];
            const mockError = new ImperativeError({
                msg: "mock error"
            });
            listDatasetSpy.mockRejectedValueOnce(mockError);
            getFileListSpy.mockReturnValueOnce(mockFileList);

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", dsName);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error).toBe(mockError);
        });
        it("should throw error when trying to upload a directory to a data set member", async () => {
            const mockFileList = ["file1"];
            const pdsMem = `${dsName}(MEMBER)`;
            getFileListSpy.mockReturnValueOnce(mockFileList);
            writeZosmfDatasetSpy.mockResolvedValueOnce({
                success: true,
                CommandResponse: "dummy"
            });
            isDirSpy.mockReturnValueOnce(true);

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", pdsMem);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.uploadDirectoryToDatasetMember.message);
        });
        it("should return information when successfully uploaded multiple files", async () => {
            const mockFileList = ["file1", "file2"];
            const mockListResponse: IZosFilesResponse = {
                success: true,
                commandResponse: "dummy response",
                apiResponse: {
                    items: [{
                        dsname: dsName,
                        dsorg: "PO"
                    }],
                    returnedRows: 1
                }
            };
            listDatasetSpy.mockResolvedValueOnce(mockListResponse);
            getFileListSpy.mockReturnValueOnce(mockFileList);
            writeZosmfDatasetSpy.mockResolvedValueOnce({
                success: true,
                CommandResponse: "dummy"
            });
            writeZosmfDatasetSpy.mockResolvedValueOnce({
                success: true,
                CommandResponse: "dummy"
            });

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBeTruthy();
            expect(response.apiResponse[0].success).toBeTruthy();
            expect(response.apiResponse[1].success).toBeTruthy();
        });
        it("should return information when successfully uploaded a files", async () => {
            const mockFileList = ["file1"];
            const mockListResponse: IZosFilesResponse = {
                success: true,
                commandResponse: "dummy response",
                apiResponse: {
                    items: [{
                        dsname: dsName,
                        dsorg: "PS"
                    }],
                    returnedRows: 1
                }
            };
            listDatasetSpy.mockResolvedValueOnce(mockListResponse);
            getFileListSpy.mockReturnValueOnce(mockFileList);
            writeZosmfDatasetSpy.mockResolvedValueOnce({
                success: true,
                CommandResponse: "dummy"
            });

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBeTruthy();
            expect(response.apiResponse[0].success).toBeTruthy();
        });
        it("should return information when successfully uploaded to a PDS member", async () => {
            const mockFileList = ["file1"];
            const pdsMem = `${dsName}(MEMBER)`;
            const mockListResponse: IZosFilesResponse = {
                success: true,
                commandResponse: "dummy response",
                apiResponse: {
                    items: [{
                        dsname: dsName,
                        dsorg: "PO"
                    }],
                    returnedRows: 1
                }
            };
            listDatasetSpy.mockResolvedValueOnce(mockListResponse);
            getFileListSpy.mockReturnValueOnce(mockFileList);
            writeZosmfDatasetSpy.mockResolvedValueOnce({
                success: true,
                CommandResponse: "dummy"
            });
            isDirSpy.mockReturnValueOnce(false);

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", pdsMem);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBeTruthy();
            expect(response.apiResponse[0].success).toBeTruthy();
        });
        it("should return information when an error encountered during uploaded multiple files", async () => {
            const mockFileList = ["file1", "file2"];
            const mockListResponse: IZosFilesResponse = {
                success: true,
                commandResponse: "dummy response",
                apiResponse: {
                    items: [{
                        dsname: dsName,
                        dsorg: "PO"
                    }],
                    returnedRows: 1
                }
            };
            listDatasetSpy.mockResolvedValueOnce(mockListResponse);
            getFileListSpy.mockReturnValueOnce(mockFileList);
            writeZosmfDatasetSpy.mockResolvedValueOnce({
                success: true,
                CommandResponse: "dummy"
            });
            writeZosmfDatasetSpy.mockRejectedValueOnce(new ImperativeError({
                msg: "dummy error"
            }));

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBeFalsy();
            expect(response.apiResponse[0].success).toBeTruthy();
            expect(response.apiResponse[1].success).toBeFalsy();
        });
        it("should return information on the non uploaded files when an error encountered during uploaded multiple files", async () => {
            const mockFileList = ["file1", "file2", "file3"];
            const mockListResponse: IZosFilesResponse = {
                success: true,
                commandResponse: "dummy response",
                apiResponse: {
                    items: [{
                        dsname: dsName,
                        dsorg: "PO"
                    }],
                    returnedRows: 1
                }
            };
            listDatasetSpy.mockResolvedValueOnce(mockListResponse);
            getFileListSpy.mockReturnValueOnce(mockFileList);
            writeZosmfDatasetSpy.mockResolvedValueOnce({
                success: true,
                CommandResponse: "dummy"
            });
            writeZosmfDatasetSpy.mockRejectedValueOnce(new ImperativeError({
                msg: "dummy error"
            }));

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBeFalsy();
            expect(response.apiResponse[0].success).toBeTruthy();
            expect(response.apiResponse[1].success).toBeFalsy();
            expect(response.apiResponse[2].success).toBe(undefined);
        });
    });

    describe("bufferToUSSFile", () => {
        const zosmfExpectSpy = jest.spyOn(ZosmfRestClient, "putExpectString");
        let USSresponse: string;
        beforeEach(() => {
            USSresponse = undefined;
            error = undefined;
            zosmfExpectSpy.mockClear();
            zosmfExpectSpy.mockImplementation(() => null);
        });

        it("should throw an error if USS file name is not specified", async () => {
            try {
                USSresponse = await Upload.bufferToUSSFile(dummySession, undefined,  Buffer.from("testing"));
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });
        it("return error that throw by the ZosmfRestClient", async () => {
            const testError = new ImperativeError({
                msg: "test error"
            });

            zosmfExpectSpy.mockRejectedValueOnce(testError);

            try {
                USSresponse = await Upload.bufferToUSSFile(dummySession, dsName, Buffer.from("testing"));
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error).toBe(testError);
        });
        it("return with proper response when upload USS file", async () => {
            const data: Buffer = Buffer.from("testing");
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const headers = [ZosmfHeaders.TEXT_PLAIN];

            try {
                USSresponse = await Upload.bufferToUSSFile(dummySession, dsName, data);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, headers, data);
        });
        it("return with proper response when upload USS file in binary", async () => {
            const data: Buffer = Buffer.from("testing");
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const headers = [ZosmfHeaders.OCTET_STREAM, ZosmfHeaders.X_IBM_BINARY];

            try {
                USSresponse = await Upload.bufferToUSSFile(dummySession, dsName, data, true);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, headers, data);
        });
    });

    describe("dirToUSSDir", () => {
        let USSresponse: IZosFilesResponse;
        const isDirSpy = jest.spyOn(IO, "isDir");
        const isDirectoryExistsSpy = jest.spyOn(Upload, "isDirectoryExist");
        const getFileListFromPathSpy = jest.spyOn(ZosFilesUtils, "getFileListFromPath");
        const getFileListWithFsSpy = jest.spyOn(fs, "readdirSync");
        const createUssDirSpy = jest.spyOn(Create, "uss");
        const fileToUSSFileSpy = jest.spyOn(Upload, "fileToUSSFile");
        const zosmfExpectSpy = jest.spyOn(ZosmfRestClient, "putExpectString");
        const pathJoinSpy = jest.spyOn(path, "join");
        const pathNormalizeSpy = jest.spyOn(path, "normalize");
        const promiseSpy = jest.spyOn(Promise, "all");


        beforeEach(() => {
            USSresponse = undefined;
            error = undefined;
            fileToUSSFileSpy.mockClear();
            createUssDirSpy.mockClear();
            isDirectoryExistsSpy.mockClear();
            getFileListFromPathSpy.mockClear();
            getFileListWithFsSpy.mockClear();
            isDirSpy.mockClear();
            pathJoinSpy.mockClear();
            pathNormalizeSpy.mockClear();
            zosmfExpectSpy.mockClear();
            zosmfExpectSpy.mockImplementation(() => null);
        });

        it("should throw an error if local directory is not specified", async () => {
            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, undefined,  dsName);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputDirectory.message);
        });

        it("should throw an error if local directory is empty string", async () => {
            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, "",  dsName);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputDirectory.message);
        });

        it("should throw an error if passed local directory path is a file", async () => {
            isDirSpy.mockReturnValueOnce(false);

            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, "some/path", dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingInputDirectory.message);
            expect(USSresponse).not.toBeDefined();
        });

        it("should throw an error if USS directory is not specified", async () => {
            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, "some/path",  undefined);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSDirectoryName.message);
        });

        it("should throw an error if USS path is empty string", async () => {
            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, "some/path",  "");
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSDirectoryName.message);
        });

        it("should return with proper response", async () => {
            const testReturn = {};
            const testPath = "test/path";
            isDirSpy.mockReturnValueOnce(true);
            isDirectoryExistsSpy.mockReturnValueOnce(true);
            getFileListFromPathSpy.mockReturnValueOnce(["file1", "file2"]);
            isDirSpy.mockReturnValueOnce(false);
            pathNormalizeSpy.mockReturnValueOnce("test/path/file1");
            fileToUSSFileSpy.mockReturnValue(testReturn);
            isDirSpy.mockReturnValueOnce(false);
            pathNormalizeSpy.mockReturnValueOnce("test/path/file2");
            fileToUSSFileSpy.mockReturnValue(testReturn);
            promiseSpy.mockReturnValueOnce({});

            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, testPath, dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();
            expect(fileToUSSFileSpy).toHaveBeenCalledTimes(2);
            expect(fileToUSSFileSpy).toHaveBeenCalledWith(dummySession, `${path.normalize(`${testPath}/file2`)}`, `${dsName}/file2`, false);
        });

        it("should upload recursively if option is specified", async () => {
            const testReturn = {};
            const testPath = "test/path";
            isDirSpy.mockReturnValueOnce(true);
            isDirectoryExistsSpy.mockReturnValueOnce(false);
            createUssDirSpy.mockReturnValueOnce({});
            getFileListWithFsSpy.mockReturnValueOnce(["test", "file1.txt", "file2.txt"]);
            isDirSpy.mockReturnValueOnce(true);
            isDirectoryExistsSpy.mockReturnValueOnce(false);
            createUssDirSpy.mockReturnValueOnce({});
            isDirSpy.mockReturnValueOnce(false);
            pathNormalizeSpy.mockReturnValueOnce("test/path/file1.txt");
            fileToUSSFileSpy.mockReturnValue(testReturn);
            isDirSpy.mockReturnValueOnce(false);
            pathNormalizeSpy.mockReturnValueOnce("test/path/file2.txt");
            fileToUSSFileSpy.mockReturnValue(testReturn);
            promiseSpy.mockReturnValueOnce({});

            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, testPath, dsName, null, true);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();
            expect(fileToUSSFileSpy).toHaveBeenCalledTimes(2);
            expect(createUssDirSpy).toHaveBeenCalledTimes(2);
            expect(fileToUSSFileSpy).toHaveBeenCalledWith(dummySession, `${path.normalize(`${testPath}/file2.txt`)}`, `${dsName}/file2.txt`, null);
        });
    });
});
