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

import { ImperativeError, IO, Session, IHeaderContent } from "@zowe/imperative";
import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IZosFilesResponse } from "../../../../src/doc/IZosFilesResponse";
import { ZosFilesConstants } from "../../../../src/constants/ZosFiles.constants";
import { IUploadOptions } from "../../../../src/methods/upload/doc/IUploadOptions";
import { Upload } from "../../../../src/methods/upload/Upload";
import { List } from "../../../../src/methods/list/List";
import { Utilities } from "../../../../src/methods/utilities/Utilities";

import { ZosFilesUtils } from "../../../../src/utils/ZosFilesUtils";
import { stripNewLines } from "../../../../../../__tests__/__src__/TestUtils";
import { Create } from "../../../../src/methods/create";
import { Tag, TransferMode, ZosFilesAttributes, ZosFilesMessages } from "../../../../src";
import { CLIENT_PROPERTY } from "../../../../src/doc/types/ZosmfRestClientProperties";
import { Readable } from "stream";

describe("z/OS Files - Upload", () => {

    const dsName = "UNIT.TEST";
    const etagValue = "123ABC";
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
                callback(null, {isFile: () => false});
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
                callback(null, {isFile: () => true});
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
        it("return with proper response with responseTimeout", async () => {
            const testReturn = {};
            const testPath = "test/path";
            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(null, {isFile: () => true});
            });

            dataSetSpy.mockReturnValueOnce(testReturn);

            try {
                response = await Upload.fileToDataset(dummySession, testPath, dsName, {responseTimeout: 5});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(dataSetSpy).toHaveBeenCalledTimes(1);
            expect(dataSetSpy).toHaveBeenLastCalledWith(dummySession, testPath, dsName, {responseTimeout: 5});
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
                callback(null, {isFile: () => false});
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
                callback(null, {isFile: () => false});
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
        it("return with proper response with responseTimeout", async () => {
            const testReturn = {};
            const testPath = "test/path";
            isDirSpy.mockReturnValueOnce(true);
            dataSetSpy.mockReturnValueOnce(testReturn);
            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(null, {isFile: () => false});
            });

            try {
                response = await Upload.dirToPds(dummySession, testPath, dsName, {responseTimeout: 5});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(dataSetSpy).toHaveBeenCalledTimes(1);
            expect(dataSetSpy).toHaveBeenLastCalledWith(dummySession, testPath, dsName, {responseTimeout: 5});
        });
        it("return with proper response with encoding", async () => {
            const encoding = 1048;
            const testReturn = {};
            const testPath = "test/path";
            isDirSpy.mockReturnValueOnce(true);
            dataSetSpy.mockReturnValueOnce(testReturn);
            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(null, {isFile: () => false});
            });

            try {
                response = await Upload.dirToPds(
                    dummySession,
                    testPath,
                    dsName,
                    { encoding: 1048 }
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(dataSetSpy).toHaveBeenCalledTimes(1);
            expect(dataSetSpy).toHaveBeenLastCalledWith(
                dummySession,
                testPath,
                dsName,
                { encoding }
            );
        });
    });

    describe("bufferToDataSet", () => {
        const zosmfExpectSpy = jest.spyOn(ZosmfRestClient, "putExpectString");
        const zosmfPutFullSpy = jest.spyOn(ZosmfRestClient, "putExpectFullResponse");
        const fakeResponseWithEtag = {data: dsName, response:{headers:{etag: etagValue}}};

        beforeEach(() => {
            response = undefined;
            error = undefined;
            zosmfExpectSpy.mockClear();
            zosmfExpectSpy.mockImplementation(() => null);

            zosmfPutFullSpy.mockClear();
            zosmfPutFullSpy.mockImplementation(() => null);
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
            const testError = new ImperativeError({
                msg: "test error"
            });

            zosmfPutFullSpy.mockRejectedValueOnce(testError);

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
            const reqHeaders = [ZosmfHeaders.X_IBM_TEXT, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders,
                writeData: buffer});
        });
        it("return with proper response when upload buffer to a PDS member", async () => {
            const buffer: Buffer = Buffer.from("testing");
            const testDsName = `${dsName}(member)`;
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, testDsName);
            const reqHeaders = [ZosmfHeaders.X_IBM_TEXT, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, testDsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource:endpoint,
                reqHeaders,
                writeData: buffer});
        });
        describe("Using optional parameters", () => {
            let buffer: Buffer;
            let uploadOptions: IUploadOptions;
            let reqHeaders: IHeaderContent[];
            let endpoint: string;
            beforeAll(() => {
                buffer = Buffer.from("testing");
                endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsName);
            });

            beforeEach(() => {
                uploadOptions = {};
                reqHeaders = [ZosmfHeaders.X_IBM_TEXT, ZosmfHeaders.ACCEPT_ENCODING];
                zosmfPutFullSpy.mockClear();
            });

            it("should return with proper response when uploading with 'binary' option", async () => {
                uploadOptions.binary = true;
                // TODO:gzip
                // reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING];
                reqHeaders = [ZosmfHeaders.X_IBM_BINARY];

                try {
                    response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeUndefined();
                expect(response).toBeDefined();

                expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
                expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                    reqHeaders,
                    writeData: buffer});
            });
            it("should return with proper response when uploading with 'encoding' option", async () => {
                const anotherEncoding = 285;
                uploadOptions.encoding = anotherEncoding;
                reqHeaders = [{ "X-IBM-Data-Type": "text;fileEncoding=285" }, ZosmfHeaders.ACCEPT_ENCODING];

                try {
                    response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeUndefined();
                expect(response).toBeDefined();

                expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
                expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                    reqHeaders,
                    writeData: buffer});
            });
            it("should return with proper response when uploading with 'recall wait' option", async () => {

                // Unit test for wait option
                uploadOptions.recall = "wait";
                reqHeaders.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_WAIT);

                try {
                    response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeUndefined();
                expect(response).toBeDefined();

                expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
                expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                    reqHeaders,
                    writeData: buffer});
            });
            it("return with proper response when uploading with 'recall nowait' option", async () => {
                // Unit test for no wait option
                uploadOptions.recall = "nowait";
                reqHeaders.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT);

                try {
                    response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeUndefined();
                expect(response).toBeDefined();

                expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
                expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                    reqHeaders,
                    writeData: buffer});
            });
            it("return with proper response when uploading with 'recall error' option", async () => {
                // Unit test for no error option
                uploadOptions.recall = "error";
                reqHeaders.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_ERROR);

                try {
                    response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeUndefined();
                expect(response).toBeDefined();

                expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
                expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                    reqHeaders,
                    writeData: buffer});
            });
            it("return with proper response when uploading with non-exiting recall option", async () => {
                // Unit test default value
                uploadOptions.recall = "non-existing";
                reqHeaders.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT);

                try {
                    response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeUndefined();
                expect(response).toBeDefined();

                expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
                expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                    reqHeaders,
                    writeData: buffer});
            });
            it("return with proper response when uploading with pass 'etag' option", async () => {
                // Unit test for pass etag option
                uploadOptions.etag = etagValue;
                reqHeaders.push({"If-Match" : uploadOptions.etag});

                try {
                    response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeUndefined();
                expect(response).toBeDefined();

                expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
                expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                    reqHeaders,
                    writeData: buffer});
            });
            it("return with proper response when uploading with return 'etag' option", async () => {
                zosmfPutFullSpy.mockImplementationOnce(() => fakeResponseWithEtag);
                // Unit test for return etag option
                reqHeaders.push(ZosmfHeaders.X_IBM_RETURN_ETAG);
                uploadOptions.returnEtag = true;
                try {
                    response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeUndefined();
                expect(response).toBeDefined();

                expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
                expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                    reqHeaders,
                    writeData: buffer,
                    dataToReturn: [CLIENT_PROPERTY.response]});
            });
            it("return with proper response when uploading with responseTimeout option", async () => {
                uploadOptions.responseTimeout = 5;
                reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: "5"});

                try {
                    response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeUndefined();
                expect(response).toBeDefined();

                expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
                expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                    reqHeaders,
                    writeData: buffer});
            });
        });
        it("return with proper response when upload dataset with specify volume option", async () => {
            const buffer: Buffer = Buffer.from("testing");
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(TEST)`, dsName);
            const reqHeaders = [ZosmfHeaders.X_IBM_TEXT, ZosmfHeaders.ACCEPT_ENCODING];
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

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders,
                writeData: buffer});
        });
    });
    describe("streamToDataSet", () => {
        const zosmfPutFullSpy = jest.spyOn(ZosmfRestClient, "putExpectFullResponse");
        const fakeResponseWithEtag = {data: dsName, response:{headers:{etag: etagValue}}};
        const inputStream = new Readable();
        inputStream.push("testing");
        inputStream.push(null);

        beforeEach(() => {
            response = undefined;
            error = undefined;

            zosmfPutFullSpy.mockClear();
            zosmfPutFullSpy.mockImplementation(() => null);
        });

        it("should throw error if data set name is not specified", async () => {
            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, undefined);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });
        it("return error that throw by the ZosmfRestClient", async () => {
            const testError = new ImperativeError({
                msg: "test error"
            });

            zosmfPutFullSpy.mockRejectedValueOnce(testError);

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName);
            } catch (err) {
                error = err;
            }

            expect(response).toBeUndefined();
            expect(error).toBeDefined();
            expect(error).toBe(testError);
        });
        it("return with proper response when upload stream to a data set", async () => {
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsName);
            const reqHeaders = [ZosmfHeaders.X_IBM_TEXT, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: true,
                reqHeaders,
                requestStream: inputStream});
        });
        it("return with proper response when upload stream to a PDS member", async () => {
            const testDsName = `${dsName}(member)`;
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, testDsName);
            const reqHeaders = [ZosmfHeaders.X_IBM_TEXT, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, testDsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource:endpoint,
                normalizeRequestNewLines: true,
                reqHeaders,
                requestStream: inputStream});
        });
        it("return with proper response when upload stream to a data set with optional parameters", async () => {
            const uploadOptions: IUploadOptions = {
                binary: true
            };
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsName);
            // TODO:gzip
            // let reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING];
            let reqHeaders = [ZosmfHeaders.X_IBM_BINARY];

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: false,
                reqHeaders,
                requestStream: inputStream});
            zosmfPutFullSpy.mockClear();

            // Unit test for wait option
            uploadOptions.recall = "wait";
            // TODO:gzip
            // reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MIGRATED_RECALL_WAIT];
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.X_IBM_MIGRATED_RECALL_WAIT];

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: false,
                reqHeaders,
                requestStream: inputStream});
            zosmfPutFullSpy.mockClear();

            // Unit test for no wait option
            uploadOptions.recall = "nowait";
            // TODO:gzip
            // reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT];
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT];

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: false,
                reqHeaders,
                requestStream: inputStream});
            zosmfPutFullSpy.mockClear();

            // Unit test for no error option
            uploadOptions.recall = "error";
            // TODO:gzip
            // reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MIGRATED_RECALL_ERROR];
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.X_IBM_MIGRATED_RECALL_ERROR];

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: false,
                reqHeaders,
                requestStream: inputStream});
            zosmfPutFullSpy.mockClear();

            // Unit test default value
            uploadOptions.recall = "non-existing";
            // TODO:gzip
            // reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT];
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT];

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: false,
                reqHeaders,
                requestStream: inputStream});
            zosmfPutFullSpy.mockClear();

            // Unit test for pass etag option
            uploadOptions.etag = etagValue;
            // TODO:gzip
            // reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT,
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT,
                {"If-Match" : uploadOptions.etag}];

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: false,
                reqHeaders,
                requestStream: inputStream});
            zosmfPutFullSpy.mockClear();
            zosmfPutFullSpy.mockImplementationOnce(() => fakeResponseWithEtag);

            // Unit test for return etag option
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY,
                // TODO:gzip
                // ZosmfHeaders.ACCEPT_ENCODING,
                ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT,
                {"If-Match" : uploadOptions.etag},
                ZosmfHeaders.X_IBM_RETURN_ETAG];
            uploadOptions.returnEtag = true;
            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: false,
                reqHeaders,
                requestStream: inputStream,
                dataToReturn: [CLIENT_PROPERTY.response]});
            zosmfPutFullSpy.mockClear();
            zosmfPutFullSpy.mockImplementationOnce(() => fakeResponseWithEtag);

            // Unit test for responseTimeout
            uploadOptions.responseTimeout = 5;
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY,
                // TODO:gzip
                // ZosmfHeaders.ACCEPT_ENCODING,
                {[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: "5"},
                ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT,
                {"If-Match" : uploadOptions.etag},
                ZosmfHeaders.X_IBM_RETURN_ETAG];

            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: false,
                reqHeaders,
                requestStream: inputStream,
                dataToReturn: [CLIENT_PROPERTY.response]});
        });
        it("return with proper response when upload dataset with specify volume option", async () => {
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(TEST)`, dsName);
            const reqHeaders = [ZosmfHeaders.X_IBM_TEXT, ZosmfHeaders.ACCEPT_ENCODING];
            const uploadOptions: IUploadOptions = {
                volume: "TEST"
            };
            try {
                response = await Upload.streamToDataSet(dummySession, inputStream, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                normalizeRequestNewLines: true,
                reqHeaders,
                requestStream: inputStream});
        });

        it("should allow uploading a data set with encoding", async () => {
            const buffer: Buffer = Buffer.from("testing");
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsName);
            const reqHeaders = [{ "X-IBM-Data-Type": "text;fileEncoding=285" }, ZosmfHeaders.ACCEPT_ENCODING];
            const uploadOptions: IUploadOptions = {
                encoding: 285
            };
            try {
                response = await Upload.bufferToDataSet(dummySession, buffer, dsName, uploadOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();

            expect(zosmfPutFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfPutFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders,
                writeData: buffer});
        });
    });
    describe("pathToDataSet", () => {
        const listDatasetSpy = jest.spyOn(List, "dataSet");
        const getFileListSpy = jest.spyOn(ZosFilesUtils, "getFileListFromPath");
        const readFileSpy = jest.spyOn(fs, "readFileSync");
        const writeZosmfDatasetSpy = jest.spyOn(Upload, "streamToDataSet");
        const isDirSpy = jest.spyOn(IO, "isDir");
        IO.createReadStream = jest.fn();
        ZosmfRestClient.putStreamedRequestOnly = jest.fn();

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
        it("should throw error when trying to upload multiple files to a PS data set", async () => {
            const mockFileList = ["file1", "file2"];
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
            writeZosmfDatasetSpy.mockResolvedValueOnce({
                success: true,
                CommandResponse: "dummy"
            });

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(response).toBeUndefined();
            expect(error.message).toContain(ZosFilesMessages.uploadDirectoryToPhysicalSequentialDataSet.message);
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
        it("should return information when successfully uploaded multiple files with responseTimeout", async () => {
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
                response = await Upload.pathToDataSet(dummySession, "dummyPath", dsName, {responseTimeout:5});
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
        it("should return etag when requested", async () => {
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
                CommandResponse: "dummy",
                apiResponse: {
                    etag: etagValue
                }
            });
            const uploadOptions: IUploadOptions = {
                returnEtag: true
            };

            try {
                response = await Upload.pathToDataSet(dummySession, "dummyPath", dsName, uploadOptions);
            } catch (err) {
                error = err;
            }
            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBeTruthy();
            expect(response.apiResponse[0].success).toBeTruthy();
            expect(response.apiResponse[0].etag).toBeDefined();
            expect(response.apiResponse[0].etag).toEqual(etagValue);
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

    describe("bufferToUssFile", () => {
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
                USSresponse = await Upload.bufferToUssFile(dummySession, undefined, Buffer.from("testing"));
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
                USSresponse = await Upload.bufferToUssFile(dummySession, dsName, Buffer.from("testing"));
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
            const headers = [ZosmfHeaders.TEXT_PLAIN, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                USSresponse = await Upload.bufferToUssFile(dummySession, dsName, data);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, headers, data);
        });
        it("return with proper response when upload USS file with responseTimeout", async () => {
            const data: Buffer = Buffer.from("testing");
            const responseTimeout = 5;
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const headers = [ZosmfHeaders.TEXT_PLAIN, ZosmfHeaders.ACCEPT_ENCODING, {[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: "5"}];

            try {
                USSresponse = await Upload.bufferToUssFile(dummySession, dsName, data, {
                    binary: false,
                    localEncoding: undefined,
                    etag: undefined,
                    returnEtag: false,
                    responseTimeout
                });
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
            const headers = [ZosmfHeaders.OCTET_STREAM, ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                USSresponse = await Upload.bufferToUssFile(dummySession, dsName, data, { binary: true });
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, headers, data);
        });
        it("return with proper response when upload USS file with Etag", async () => {
            const data: Buffer = Buffer.from("testing");
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const headers = [ZosmfHeaders.TEXT_PLAIN, ZosmfHeaders.ACCEPT_ENCODING, {"If-Match": etagValue}];

            try {
                USSresponse = await Upload.bufferToUssFile(dummySession, dsName, data, {
                    binary: false,
                    localEncoding: undefined,
                    etag: etagValue
                });
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, headers, data);
        });
        it("should set local encoding if specified", async () => {
            const data: Buffer = Buffer.from("testing");
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const headers = [{"Content-Type": "UCS-2"}, ZosmfHeaders.X_IBM_TEXT, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                USSresponse = await Upload.bufferToUssFile(dummySession, dsName, data, {
                    binary: false,
                    localEncoding: "UCS-2"
                });
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, headers, data);
        });
    });

    describe("streamToUssFile", () => {
        let USSresponse: IZosFilesResponse;
        const zosmfExpectFullSpy = jest.spyOn(ZosmfRestClient, "putExpectFullResponse");
        const fakeResponseWithEtag = {data: dsName, response:{headers:{etag: etagValue}}};
        const inputStream = new Readable();
        inputStream.push("testing");
        inputStream.push(null);

        beforeEach(() => {
            USSresponse = undefined;
            error = undefined;

            zosmfExpectFullSpy.mockClear();
            zosmfExpectFullSpy.mockImplementation(() => null);
        });

        afterAll(() => {
            zosmfExpectFullSpy.mockRestore();
        });

        it("should throw an error if USS file name is not specified", async () => {
            try {
                USSresponse = await Upload.streamToUssFile(dummySession, undefined, inputStream);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });
        it("return error that is thrown by the ZosmfRestClient", async () => {
            const testError = new ImperativeError({
                msg: "test error"
            });

            zosmfExpectFullSpy.mockRejectedValueOnce(testError);

            try {
                USSresponse = await Upload.streamToUssFile(dummySession, dsName, inputStream);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error).toBe(testError);
        });
        it("return with proper response when upload USS file", async () => {
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const reqHeaders = [ZosmfHeaders.TEXT_PLAIN, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                USSresponse = await Upload.streamToUssFile(dummySession, dsName, inputStream);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();

            expect(zosmfExpectFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders,
                requestStream: inputStream,
                normalizeRequestNewLines: true});
        });
        it("return with proper response when upload USS file with responseTimeout", async () => {
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const reqHeaders = [ZosmfHeaders.TEXT_PLAIN, ZosmfHeaders.ACCEPT_ENCODING, {[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: "5"}];

            try {
                USSresponse = await Upload.streamToUssFile(dummySession, dsName, inputStream, {responseTimeout: 5});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();

            expect(zosmfExpectFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectFullSpy).toHaveBeenCalledWith(dummySession, {resource: endpoint,
                reqHeaders,
                requestStream: inputStream,
                normalizeRequestNewLines: true});
        });
        it("return with proper response when upload USS file in binary", async () => {
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const reqHeaders = [ZosmfHeaders.OCTET_STREAM, ZosmfHeaders.X_IBM_BINARY, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                USSresponse = await Upload.streamToUssFile(dummySession, dsName, inputStream, {binary: true});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();

            expect(zosmfExpectFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectFullSpy).toHaveBeenCalledWith(dummySession, {
                resource: endpoint,
                reqHeaders,
                requestStream: inputStream,
                normalizeRequestNewLines: false});
        });
        it("return with proper response when upload USS file with Etag", async () => {
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const reqHeaders = [ZosmfHeaders.TEXT_PLAIN, ZosmfHeaders.ACCEPT_ENCODING, {"If-Match": etagValue}];

            try {
                USSresponse = await Upload.streamToUssFile(dummySession, dsName, inputStream, {etag: etagValue});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();

            expect(zosmfExpectFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectFullSpy).toHaveBeenCalledWith(dummySession, {
                resource: endpoint,
                reqHeaders,
                requestStream: inputStream,
                normalizeRequestNewLines: true});
        });
        it("return with proper response when upload USS file and request Etag back", async () => {
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const reqHeaders = [ZosmfHeaders.TEXT_PLAIN, ZosmfHeaders.ACCEPT_ENCODING, ZosmfHeaders.X_IBM_RETURN_ETAG];
            zosmfExpectFullSpy.mockImplementationOnce(() => fakeResponseWithEtag);
            try {
                USSresponse = await Upload.streamToUssFile(dummySession, dsName, inputStream, {returnEtag: true});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();
            expect(USSresponse.apiResponse.etag).toBeDefined();
            expect(USSresponse.apiResponse.etag).toEqual(etagValue);

            expect(zosmfExpectFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectFullSpy).toHaveBeenCalledWith(dummySession, {
                resource: endpoint,
                reqHeaders,
                requestStream: inputStream,
                normalizeRequestNewLines: true,
                dataToReturn: [CLIENT_PROPERTY.response]});
        });
        it("should set local encoding if specified", async () => {
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, dsName);
            const reqHeaders = [{"Content-Type": "UCS-2"}, ZosmfHeaders.X_IBM_TEXT, ZosmfHeaders.ACCEPT_ENCODING];

            try {
                USSresponse = await Upload.streamToUssFile(dummySession, dsName, inputStream, {localEncoding: "UCS-2"});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();

            expect(zosmfExpectFullSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectFullSpy).toHaveBeenCalledWith(dummySession, {
                resource: endpoint,
                reqHeaders,
                requestStream: inputStream,
                normalizeRequestNewLines: true});
        });
    });

    describe("fileToUssFile", () => {
        let USSresponse: IZosFilesResponse;
        const createReadStreamSpy = jest.spyOn(IO, "createReadStream");
        const streamToUssFileSpy = jest.spyOn(Upload, "streamToUssFile");
        const lsStatSpy = jest.spyOn(fs, "lstat");
        const inputFile = "/path/to/file1.txt";

        beforeEach(() => {
            USSresponse = undefined;
            error = undefined;

            createReadStreamSpy.mockReset();
            createReadStreamSpy.mockImplementation(() => null);

            streamToUssFileSpy.mockReset();
            streamToUssFileSpy.mockImplementation(() => null);

            lsStatSpy.mockClear();
            lsStatSpy.mockImplementation((somePath, callback) => {
                callback(null, {isFile: () => true});
            });
        });

        it("should throw an error if local file name is not specified", async () => {
            try {
                USSresponse = await Upload.fileToUssFile(dummySession, undefined, "file");
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputFile.message);
        });
        it("should throw an error if USS file name is not specified", async () => {
            try {
                USSresponse = await Upload.fileToUssFile(dummySession, inputFile, undefined);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });
        it("should throw an error if USS file name is an empty string", async () => {
            try {
                USSresponse = await Upload.fileToUssFile(dummySession, inputFile, "");
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
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
            try {
                USSresponse = await Upload.fileToUssFile(dummySession, inputFile, "file");
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.nodeJsFsError.message);
            expect(error.additionalDetails).toEqual(rootError.toString());
            expect(error.causeErrors).toBe(rootError);
        });
        it("return with proper response when upload USS file", async () => {
            try {
                USSresponse = await Upload.fileToUssFile(dummySession, inputFile, "file");
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();

            expect(createReadStreamSpy).toHaveBeenCalledTimes(1);
            expect(createReadStreamSpy).toHaveBeenCalledWith(inputFile);
            expect(streamToUssFileSpy).toHaveBeenCalledTimes(1);
            expect(streamToUssFileSpy).toHaveBeenCalledWith(dummySession, "file", null, {});
        });
        it("return with proper response when upload USS file with responseTimeout", async () => {
            try {
                USSresponse = await Upload.fileToUssFile(dummySession, inputFile, "file", {responseTimeout: 5});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();

            expect(createReadStreamSpy).toHaveBeenCalledTimes(1);
            expect(createReadStreamSpy).toHaveBeenCalledWith(inputFile);
            expect(streamToUssFileSpy).toHaveBeenCalledTimes(1);
            expect(streamToUssFileSpy).toHaveBeenCalledWith(dummySession, "file", null, {responseTimeout: 5});
        });
        it("return with proper response when upload USS file including Etag", async () => {
            const streamResponse: IZosFilesResponse = {
                success: true,
                commandResponse: undefined,
                apiResponse: {etag: etagValue}};
            streamToUssFileSpy.mockImplementationOnce(() => streamResponse);
            try {
                USSresponse = await Upload.fileToUssFile(dummySession, inputFile, "file", {returnEtag: true});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();
            expect(USSresponse.apiResponse.etag).toEqual(etagValue);

            expect(createReadStreamSpy).toHaveBeenCalledTimes(1);
            expect(createReadStreamSpy).toHaveBeenCalledWith(inputFile);
            expect(streamToUssFileSpy).toHaveBeenCalledTimes(1);
            expect(streamToUssFileSpy).toHaveBeenCalledWith(dummySession, "file", null, {returnEtag: true});
        });
        it("should throw an error if local file name is not a valid file path", async () => {
            lsStatSpy.mockImplementationOnce((somePath, callback) => {
                callback(null, {isFile: () => false});
            });
            try {
                USSresponse = await Upload.fileToUssFile(dummySession, undefined, "file");
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputFile.message);
            lsStatSpy.mockClear();
        });
    });
    describe("dirToUSSDirRecursive", () => {
        let USSresponse: IZosFilesResponse;
        const isDirSpy = jest.spyOn(IO, "isDir");
        const isDirectoryExistsSpy = jest.spyOn(Upload, "isDirectoryExist");
        const getFileListFromPathSpy = jest.spyOn(ZosFilesUtils, "getFileListFromPath");
        const getFileListWithFsSpy = jest.spyOn(fs, "readdirSync");
        const createUssDirSpy = jest.spyOn(Create, "uss");
        const fileToUssFileSpy = jest.spyOn(Upload, "fileToUssFile");
        const zosmfExpectSpy = jest.spyOn(ZosmfRestClient, "putExpectString");
        const zosmfExpectFullSpy = jest.spyOn(ZosmfRestClient, "putExpectFullResponse");
        const pathJoinSpy = jest.spyOn(path, "join");
        const pathNormalizeSpy = jest.spyOn(path, "normalize");
        const filterDirectoriesSpy = jest.spyOn(Array.prototype, "filter");
        const promiseSpy = jest.spyOn(Promise, "all");
        const testReturn = {};
        const testPath = "test/path";

        beforeEach(() => {
            USSresponse = undefined;
            error = undefined;
            fileToUssFileSpy.mockClear();
            createUssDirSpy.mockClear();
            isDirectoryExistsSpy.mockClear();
            getFileListFromPathSpy.mockClear();
            getFileListWithFsSpy.mockClear();
            isDirSpy.mockClear();
            pathJoinSpy.mockClear();
            pathNormalizeSpy.mockClear();
            zosmfExpectSpy.mockClear();
            zosmfExpectFullSpy.mockClear();
            filterDirectoriesSpy.mockClear();
            zosmfExpectSpy.mockImplementation(() => null);
            zosmfExpectFullSpy.mockImplementation(() => null);
        });

        afterAll(() => {
            zosmfExpectFullSpy.mockRestore();
        });

        it("should upload recursively if option is specified", async () => {
            isDirSpy.mockReturnValue(true);
            isDirectoryExistsSpy.mockReturnValueOnce(false).mockReturnValueOnce(true);
            createUssDirSpy.mockReturnValueOnce({}).mockReturnValueOnce({});
            getFileListWithFsSpy.mockReturnValueOnce(["test", "file1.txt", "file2.txt"]).mockReturnValueOnce(["test", "file1.txt", "file2.txt"])
                .mockReturnValueOnce([]);
            filterDirectoriesSpy.mockReturnValueOnce(["test"]).mockReturnValueOnce(["test"]);
            getFileListFromPathSpy.mockReturnValueOnce(["file1.txt", "file2.txt"]).mockReturnValueOnce([]);
            fileToUssFileSpy.mockReturnValue({});
            try {
                USSresponse = await Upload.dirToUSSDirRecursive(dummySession, testPath, dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();
            expect(createUssDirSpy).toHaveBeenCalledTimes(2);
        });

        it("should upload recursively if option is specified and work with responseTimeout", async () => {
            isDirSpy.mockReturnValue(true);
            isDirectoryExistsSpy.mockReturnValueOnce(false).mockReturnValueOnce(true);
            createUssDirSpy.mockReturnValueOnce({}).mockReturnValueOnce({});
            getFileListWithFsSpy.mockReturnValueOnce(["test", "file1.txt", "file2.txt"]).mockReturnValueOnce(["test", "file1.txt", "file2.txt"])
                .mockReturnValueOnce([]);
            filterDirectoriesSpy.mockReturnValueOnce(["test"]).mockReturnValueOnce(["test"]);
            getFileListFromPathSpy.mockReturnValueOnce(["file1.txt", "file2.txt"]).mockReturnValueOnce([]);
            fileToUssFileSpy.mockReturnValue({});
            try {
                USSresponse = await Upload.dirToUSSDirRecursive(dummySession, testPath, dsName, {responseTimeout: 5});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();
            expect(createUssDirSpy).toHaveBeenCalledTimes(2);
        });

        it("should throw an error if local directory is not specified", async () => {
            try {
                USSresponse = await Upload.dirToUSSDirRecursive(dummySession, undefined, dsName);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputDirectory.message);
        });

        it("should throw an error if local directory is empty string", async () => {
            try {
                USSresponse = await Upload.dirToUSSDirRecursive(dummySession, "", dsName);
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
                USSresponse = await Upload.dirToUSSDirRecursive(dummySession, "some/path", dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingInputDirectory.message);
            expect(USSresponse).not.toBeDefined();
        });

        it("should throw an error if USS directory is not specified", async () => {
            try {
                USSresponse = await Upload.dirToUSSDirRecursive(dummySession, "some/path", undefined);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSDirectoryName.message);
        });

        it("should throw an error if USS path is empty string", async () => {
            try {
                USSresponse = await Upload.dirToUSSDirRecursive(dummySession, "some/path", "");
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSDirectoryName.message);
        });

        it("should return with proper response", async () => {
            isDirSpy.mockReturnValueOnce(true);
            isDirectoryExistsSpy.mockReturnValueOnce(true);
            getFileListWithFsSpy.mockReturnValueOnce(["file1", "file2"]);
            filterDirectoriesSpy.mockReturnValueOnce([]);
            getFileListFromPathSpy.mockReturnValueOnce(["file1", "file2"]);
            fileToUssFileSpy.mockReturnValue(testReturn);
            fileToUssFileSpy.mockReturnValue(testReturn);
            promiseSpy.mockReturnValueOnce({});

            try {
                USSresponse = await Upload.dirToUSSDirRecursive(dummySession, testPath, dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();
        });
    });

    describe("dirToUSSDir", () => {
        let USSresponse: IZosFilesResponse;
        const isDirSpy = jest.spyOn(IO, "isDir");
        const isDirectoryExistsSpy = jest.spyOn(Upload, "isDirectoryExist");
        const getFileListFromPathSpy = jest.spyOn(ZosFilesUtils, "getFileListFromPath");
        const getFileListWithFsSpy = jest.spyOn(fs, "readdirSync");
        const createUssDirSpy = jest.spyOn(Create, "uss");
        const fileToUssFileSpy = jest.spyOn(Upload, "fileToUssFile");
        const zosmfExpectSpy = jest.spyOn(ZosmfRestClient, "putExpectString");
        const zosmfExpectFullSpy = jest.spyOn(ZosmfRestClient, "putExpectFullResponse");
        const pathJoinSpy = jest.spyOn(path, "join");
        const pathNormalizeSpy = jest.spyOn(path, "normalize");
        const promiseSpy = jest.spyOn(Promise, "all");
        const filterDirectoriesSpy = jest.spyOn(Array.prototype, "filter");
        const testReturn = {};
        const testPath = "test/path";

        beforeEach(() => {
            USSresponse = undefined;
            error = undefined;
            fileToUssFileSpy.mockClear();
            createUssDirSpy.mockClear();
            isDirectoryExistsSpy.mockClear();
            getFileListFromPathSpy.mockClear();
            getFileListWithFsSpy.mockClear();
            isDirSpy.mockClear();
            pathJoinSpy.mockClear();
            pathNormalizeSpy.mockClear();
            zosmfExpectSpy.mockClear();
            zosmfExpectFullSpy.mockClear();
            filterDirectoriesSpy.mockClear();
            zosmfExpectSpy.mockImplementation(() => null);
            zosmfExpectFullSpy.mockImplementation(() => null);
        });

        afterAll(() => {
            zosmfExpectFullSpy.mockRestore();
        });

        it("should throw an error if local directory is not specified", async () => {
            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, undefined, dsName);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingInputDirectory.message);
        });

        it("should throw an error if local directory is empty string", async () => {
            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, "", dsName);
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
                USSresponse = await Upload.dirToUSSDir(dummySession, "some/path", undefined);
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSDirectoryName.message);
        });

        it("should throw an error if USS path is empty string", async () => {
            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, "some/path", "");
            } catch (err) {
                error = err;
            }

            expect(USSresponse).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSDirectoryName.message);
        });

        it("should return with proper response", async () => {
            isDirSpy.mockReturnValueOnce(true);
            isDirectoryExistsSpy.mockReturnValueOnce(true);
            getFileListFromPathSpy.mockReturnValueOnce(["file1", "file2"]);
            fileToUssFileSpy.mockReturnValue(testReturn);
            fileToUssFileSpy.mockReturnValue(testReturn);
            promiseSpy.mockReturnValueOnce({});

            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, testPath, dsName);
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();
        });
        it("should return with proper response with responseTimeout", async () => {
            isDirSpy.mockReturnValueOnce(true);
            isDirectoryExistsSpy.mockReturnValueOnce(true);
            getFileListFromPathSpy.mockReturnValueOnce(["file1", "file2"]);
            fileToUssFileSpy.mockReturnValue(testReturn);
            fileToUssFileSpy.mockReturnValue(testReturn);
            promiseSpy.mockReturnValueOnce({});

            try {
                USSresponse = await Upload.dirToUSSDir(dummySession, testPath, dsName, {responseTimeout: 5});
            } catch (err) {
                error = err;
            }

            expect(error).toBeUndefined();
            expect(USSresponse).toBeDefined();
            expect(USSresponse.success).toBeTruthy();
        });
        describe("scenarios with .zosattributes file", () => {

            const MockZosAttributes = jest.fn<ZosFilesAttributes>();
            const attributesMock = new MockZosAttributes();
            const chtagSpy = jest.spyOn(Utilities,"chtag");

            beforeEach(() => {
                pathNormalizeSpy.mockRestore();
                promiseSpy.mockRestore();
                chtagSpy.mockReset();
                chtagSpy.mockReturnValue(testReturn);
                isDirSpy.mockReturnValueOnce(true)
                    .mockReturnValue(false);
                isDirectoryExistsSpy.mockReturnValue(true);
                fileToUssFileSpy.mockReturnValue(testReturn);

                attributesMock.getFileTransferMode = jest.fn((filePath: string) => {
                    if (filePath.endsWith("textfile")) {
                        return TransferMode.TEXT;
                    } else {
                        return TransferMode.BINARY;
                    }
                });
                attributesMock.getRemoteEncoding = jest.fn((filePath: string) => {
                    if (filePath.endsWith("textfile") || filePath.endsWith("asciifile")) {
                        return "ISO8859-1";
                    } else {
                        return "binary";
                    }
                });
                attributesMock.getLocalEncoding = jest.fn((filePath: string) => {
                    if (filePath.endsWith("textfile") || filePath.endsWith("asciifile")) {
                        return "ISO8859-1";
                    } else {
                        return "binary";
                    }
                });
            });

            it("should upload files unless they are ignored by attributes", async () => {
                getFileListFromPathSpy.mockReturnValue(["uploadme", "ignoreme"]);
                attributesMock.fileShouldBeUploaded = jest.fn((filePath: string) => {
                    return filePath.endsWith("uploadme");
                });

                USSresponse = await Upload.dirToUSSDir(dummySession, testPath, dsName, {attributes: attributesMock});

                expect(USSresponse).toBeDefined();
                expect(USSresponse.success).toBeTruthy();
                expect(attributesMock.fileShouldBeUploaded).toHaveBeenCalledTimes(2);
                expect(attributesMock.fileShouldBeUploaded).toHaveBeenCalledWith(path.normalize(path.join(testPath,"uploadme")));
                expect(attributesMock.fileShouldBeUploaded).toHaveBeenCalledWith(path.normalize(path.join(testPath,"ignoreme")));

                expect(fileToUssFileSpy).toHaveBeenCalledTimes(1);
                expect(fileToUssFileSpy).toHaveBeenCalledWith(dummySession,
                    path.normalize(path.join(testPath,"uploadme")),
                    `${dsName}/uploadme`, {binary: true});
            });

            it("should not upload ignored directories", async () => {
                // This test simulates trying to upload the following structure:
                //   uploaddir
                //      uploadedfile
                //   ignoredir
                //      ignoredfile

                isDirSpy.mockImplementation((dirPath: string) => {
                    return (dirPath.endsWith("dir"));
                });
                getFileListWithFsSpy.mockImplementation((dirPath: string) => {
                    if (dirPath.endsWith("uploaddir")) {
                        return ["uploadedfile"];
                    } else if (dirPath.endsWith("ignoredir")) {
                        return ["ignoredfile"];
                    } else {
                        return ["uploaddir", "ignoredir"];
                    }
                });
                getFileListFromPathSpy.mockImplementation((dirPath: string) => {
                    if (dirPath.endsWith("uploaddir")) {
                        return ["uploadedfile"];
                    } else if (dirPath.endsWith("ignoredir")) {
                        return ["ignoredfile"];
                    } else {
                        return [];
                    }
                });
                attributesMock.fileShouldBeUploaded = jest.fn((ignorePath: string) => {
                    if (ignorePath.endsWith("ignoredir")) {
                        return false;
                    } else {
                        return true;
                    }
                });

                USSresponse = await Upload.dirToUSSDirRecursive(dummySession, testPath, dsName, {attributes: attributesMock});

                expect(USSresponse).toBeDefined();
                expect(USSresponse.success).toBeTruthy();
                expect(attributesMock.fileShouldBeUploaded).toHaveBeenCalledWith(path.normalize(path.join(testPath,"uploaddir")));
                expect(fileToUssFileSpy).toHaveBeenCalledTimes(1);
                expect(fileToUssFileSpy).toHaveBeenCalledWith(dummySession,
                    path.normalize(path.join(testPath, "uploaddir", "uploadedfile")),
                    `${dsName}/uploaddir/uploadedfile`, {binary: true});
            });
            it("should upload files in text or binary according to attributes", async () => {
                getFileListFromPathSpy.mockReturnValue(["textfile", "binaryfile"]);
                attributesMock.fileShouldBeUploaded = jest.fn(() => true);

                USSresponse = await Upload.dirToUSSDir(dummySession, testPath, dsName, {attributes: attributesMock});

                expect(USSresponse).toBeDefined();
                expect(USSresponse.success).toBeTruthy();
                expect(fileToUssFileSpy).toHaveBeenCalledTimes(2);
                expect(fileToUssFileSpy).toHaveBeenCalledWith(dummySession,
                    path.normalize(path.join(testPath,"textfile")),
                    `${dsName}/textfile`,
                    {binary: false,
                        localEncoding: "ISO8859-1"});
                expect(fileToUssFileSpy).toHaveBeenCalledWith(dummySession,
                    path.normalize(path.join(testPath,"binaryfile")),
                    `${dsName}/binaryfile`, {binary: true});
            });

            it("should call API to tag files accord to remote encoding", async () => {
                getFileListFromPathSpy.mockReturnValue(["textfile", "binaryfile"]);
                attributesMock.fileShouldBeUploaded = jest.fn(() => true);

                USSresponse = await Upload.dirToUSSDir(dummySession, testPath, dsName, {attributes: attributesMock});

                expect(USSresponse).toBeDefined();
                expect(USSresponse.success).toBeTruthy();
                expect(chtagSpy).toHaveBeenCalledTimes(2);
                expect(chtagSpy).toHaveBeenCalledWith(dummySession, `${dsName}/textfile`, Tag.TEXT, "ISO8859-1");
                expect(chtagSpy).toHaveBeenCalledWith(dummySession, `${dsName}/binaryfile`, Tag.BINARY);
            });

            it("should call API to tag a file as text that was uploaded in binary mode", async () => {
                getFileListFromPathSpy.mockReturnValue(["asciifile"]);
                attributesMock.fileShouldBeUploaded = jest.fn(() => true);
                USSresponse = await Upload.dirToUSSDir(dummySession, testPath, dsName, {attributes: attributesMock});

                expect(USSresponse).toBeDefined();
                expect(USSresponse.success).toBeTruthy();
                expect(chtagSpy).toHaveBeenCalledTimes(1);
                expect(chtagSpy).toHaveBeenCalledWith(dummySession, `${dsName}/asciifile`, Tag.TEXT, "ISO8859-1");
            });
        });
    });
});
