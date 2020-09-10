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

import { Session } from "@zowe/imperative";
import { posix } from "path";
import { Delete, IZosFilesResponse, ZosFilesConstants, ZosFilesMessages } from "../../../../";

import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IDeleteDatasetOptions } from "../../../../src/methods/delete/doc/IDeleteDatasetOptions";
import { IDeleteVsamOptions } from "../../../../src/methods/delete/doc/IDeleteVsamOptions";
import { Invoke } from "../../../../src/methods/invoke";
import { IZosFilesOptions } from "../../../../src/doc/IZosFilesOptions";

describe("Delete", () => {
    const deleteExpectStringSpy = jest.spyOn(ZosmfRestClient, "deleteExpectString");

    beforeEach(() => {
        deleteExpectStringSpy.mockClear();
        deleteExpectStringSpy.mockImplementation(async () => {
            return "";
        });
    });

    const dummySession = new Session({
        user: "dummy",
        password: "dummy",
        hostname: "machine",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    describe("dataSet", () => {
        const dataset = "EFGH";

        it("should throw an error if data set name is missing", async () => {
            let caughtError;

            // TEST AGAINST EMPTY STRING
            try {
                await Delete.dataSet(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;

            // TEST AGAINST NULL
            try {
                await Delete.dataSet(dummySession, null as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;

            // TEST AGAINST UNDEFINED
            try {
                await Delete.dataSet(dummySession, undefined as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should send a request without volume", async () => {
            const apiResponse = await Delete.dataSet(dummySession, dataset);

            expect(apiResponse).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetDeletedSuccessfully.message
            });

            expect(deleteExpectStringSpy).toHaveBeenCalledTimes(1);
            expect(deleteExpectStringSpy).toHaveBeenLastCalledWith(
                dummySession,
                posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dataset),
                []
            );
        });

        it("should send a request with volume", async () => {
            const options: IDeleteDatasetOptions = {
                volume: "ABCD"
            };

            const apiResponse = await Delete.dataSet(dummySession, dataset, options);

            expect(apiResponse).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetDeletedSuccessfully.message
            });

            expect(deleteExpectStringSpy).toHaveBeenCalledTimes(1);
            expect(deleteExpectStringSpy).toHaveBeenLastCalledWith(
                dummySession,
                posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(${options.volume})`, dataset),
                []
            );
        });

        it("should send a request with responseTimeout", async () => {
            const options: IDeleteDatasetOptions = {
                volume: "ABCD",
                responseTimeout: 5
            };

            const apiResponse = await Delete.dataSet(dummySession, dataset, options);

            expect(apiResponse).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetDeletedSuccessfully.message
            });

            expect(deleteExpectStringSpy).toHaveBeenCalledTimes(1);
            expect(deleteExpectStringSpy).toHaveBeenLastCalledWith(
                dummySession,
                posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(${options.volume})`, dataset),
                [{"X-IBM-Response-Timeout": "5"}]
            );
        });

        it("should handle an error from the ZosmfRestClient", async () => {
            const error = new Error("This is a test");

            deleteExpectStringSpy.mockImplementation(async () => {
                throw error;
            });

            let caughtError;

            try {
                await Delete.dataSet(dummySession, dataset);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBe(error);
        });
    });

    describe("vsam", () => {
        const defaultReturn: IZosFilesResponse = {
            success: true,
            commandResponse: "THIS IS A TEST"
        };

        const invokeAmsSpy = jest.spyOn(Invoke, "ams");
        const dsName = "ABCD";

        /**
         * Testing utility to generate the control statements that should be sent to the AMS command
         * @param {string} ds Expected dataset
         * @param {IDeleteVsamOptions} [options={}] Expected options
         * @returns {string[]} The formatted array of control statements
         */
        const formatAmsStatements = (ds: string, options: IDeleteVsamOptions = {}) => {
            return [
                "DELETE -",
                `${ds} -`,
                "CLUSTER -",
                `${options.erase ? "ERASE" : "NOERASE"} -`,
                options.purge ? "PURGE" : "NOPURGE"
            ];
        };

        beforeEach(() => {
            invokeAmsSpy.mockClear();
            invokeAmsSpy.mockImplementation(async () => defaultReturn);
        });

        it("should throw an error if data set name is missing", async () => {
            let caughtError;

            // TEST AGAINST EMPTY STRING
            try {
                await Delete.vsam(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;

            // TEST AGAINST NULL
            try {
                await Delete.vsam(dummySession, null as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;

            // TEST AGAINST UNDEFINED
            try {
                await Delete.vsam(dummySession, undefined as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should work with defaults", async () => {
            const apiResponse = await Delete.vsam(dummySession, dsName);
            const zosFilesOptions: IZosFilesOptions = {responseTimeout: undefined};

            expect(invokeAmsSpy).toHaveBeenCalledTimes(1);
            expect(invokeAmsSpy).toHaveBeenLastCalledWith(
                dummySession,
                formatAmsStatements(dsName),
                zosFilesOptions
            );

            expect(apiResponse).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetDeletedSuccessfully.message,
                apiResponse: defaultReturn
            });
        });

        describe("Options", () => {
            it("should use purge", async () => {
                const options = {
                    purge: true
                };
                const zosFilesOptions: IZosFilesOptions = {responseTimeout: undefined};

                const apiResponse = await Delete.vsam(dummySession, dsName, options);

                expect(invokeAmsSpy).toHaveBeenCalledTimes(1);
                expect(invokeAmsSpy).toHaveBeenLastCalledWith(
                    dummySession,
                    formatAmsStatements(dsName, options),
                    zosFilesOptions
                );

                expect(apiResponse).toEqual({
                    success: true,
                    commandResponse: ZosFilesMessages.datasetDeletedSuccessfully.message,
                    apiResponse: defaultReturn
                });
            });

            it("should use erase", async () => {
                const options = {
                    erase: true
                };
                const zosFilesOptions: IZosFilesOptions = {responseTimeout: undefined};

                const apiResponse = await Delete.vsam(dummySession, dsName, options);

                expect(invokeAmsSpy).toHaveBeenCalledTimes(1);
                expect(invokeAmsSpy).toHaveBeenLastCalledWith(
                    dummySession,
                    formatAmsStatements(dsName, options),
                    zosFilesOptions
                );

                expect(apiResponse).toEqual({
                    success: true,
                    commandResponse: ZosFilesMessages.datasetDeletedSuccessfully.message,
                    apiResponse: defaultReturn
                });
            });

            it("should use erase with responseTimeout", async () => {
                const options = {
                    erase: true,
                    responseTimeout: 5
                };
                const zosFilesOptions: IZosFilesOptions = {responseTimeout: 5};

                const apiResponse = await Delete.vsam(dummySession, dsName, options);

                expect(invokeAmsSpy).toHaveBeenCalledTimes(1);
                expect(invokeAmsSpy).toHaveBeenLastCalledWith(
                    dummySession,
                    formatAmsStatements(dsName, options),
                    zosFilesOptions
                );

                expect(apiResponse).toEqual({
                    success: true,
                    commandResponse: ZosFilesMessages.datasetDeletedSuccessfully.message,
                    apiResponse: defaultReturn
                });
            });
        });

        it("should handle errors returned from the Invoke API", async () => {
            const error = new Error("test");

            invokeAmsSpy.mockImplementation(async () => {
                throw error;
            });

            let caughtError: Error;
            try {
                await Delete.vsam(dummySession, dsName);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError).toBe(error);
        });
    });

    describe("uss", () => {
        const dataset = "IJKL";

        it("should throw an error if file name is missing", async () => {
            let caughtError;

            // TEST AGAINST EMPTY STRING
            try {
                await Delete.ussFile(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);

            caughtError = undefined;

            // TEST AGAINST NULL
            try {
                await Delete.ussFile(dummySession, null as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);

            caughtError = undefined;

            // TEST AGAINST UNDEFINED
            try {
                await Delete.ussFile(dummySession, undefined as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should handle an error from the ZosmfRestClient", async () => {
            const error = new Error("This is a test");

            deleteExpectStringSpy.mockImplementation(async () => {
                throw error;
            });

            let caughtError;

            try {
                await Delete.ussFile(dummySession, dataset);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBe(error);
        });
    });

    describe("zfs", () => {
        const fileSystemName = "TEST.ZFS";

        it("should succeed with correct parameters", async () => {
            (ZosmfRestClient as any).deleteExpectString = jest.fn(() => {
                // Do nothing
            });
            await Delete.zfs(dummySession, fileSystemName);
        });

        it("should fail if fileSystemName is missing or blank", async () => {
            let caughtError;
            (ZosmfRestClient as any).deleteExpectString = jest.fn(() => {
                // Do nothing
            });

            // TEST AGAINST EMPTY STRING
            try {
                await Delete.zfs(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingFileSystemName.message);

            caughtError = undefined;

            // TEST AGAINST NULL
            try {
                await Delete.zfs(dummySession, null as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingFileSystemName.message);

            caughtError = undefined;

            // TEST AGAINST UNDEFINED
            try {
                await Delete.zfs(dummySession, undefined as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingFileSystemName.message);
        });

        it("should handle an error from the ZosmfRestClient", async () => {
            const error = new Error("This is a test");

            let caughtError;
            (ZosmfRestClient as any).deleteExpectString = jest.fn(() => {
                throw error;
            });

            try {
                await Delete.zfs(dummySession, fileSystemName);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError).toBe(error);
        });
    });
});

