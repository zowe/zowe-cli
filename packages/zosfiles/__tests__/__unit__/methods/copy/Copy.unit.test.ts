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

import { Session, ImperativeError, IO, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { posix } from "path";
import * as fs from "fs";
import { error } from "console";
import * as util from "util";
import { Copy, Create, Get, List, Upload, ZosFilesConstants, ZosFilesMessages, IZosFilesResponse, Download, ZosFilesUtils } from "../../../../src";
import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import path = require("path");
import { tmpdir } from "os";

describe("Copy", () => {
    const dummySession = new Session({
        user: "dummy",
        password: "dummy",
        hostname: "localhost",
        port: 443,
        protocol: "https",
        type: "basic"
    });
    const task: ITaskWithStatus = {
        percentComplete: 0,
        statusMessage: "Copying data set",
        stageName: TaskStage.IN_PROGRESS
    };

    describe("Data Set", () => {
        const copyExpectStringSpy = jest.spyOn(ZosmfRestClient, "putExpectString");
        const copyPDSSpy = jest.spyOn(Copy, "copyPDS");
        const fromDataSetName = "USER.DATA.FROM";
        const fromMemberName = "mem1";
        const toDataSetName = "USER.DATA.TO";
        const toMemberName = "mem2";
        const isPDSSpy = jest.spyOn(Copy as any, "isPDS");
        const hasIdenticalMemberNames = jest.spyOn(Copy as any, "hasIdenticalMemberNames");
        let dataSetExistsSpy: jest.SpyInstance;
        const promptFn = jest.fn();
        const promptForIdenticalNamedMembers = jest.fn();
        const listAllMembersSpy = jest.spyOn(List, "allMembers");

        beforeEach(() => {
            copyPDSSpy.mockClear();
            copyExpectStringSpy.mockClear().mockImplementation(async () => { return ""; });
            isPDSSpy.mockClear().mockResolvedValue(false);
            dataSetExistsSpy = jest.spyOn(Copy as any, "dataSetExists").mockResolvedValue(true);
            hasIdenticalMemberNames.mockClear().mockResolvedValue(false);
            promptForIdenticalNamedMembers.mockClear();
        });
        afterAll(() => {
            isPDSSpy.mockRestore();
            dataSetExistsSpy.mockRestore();
        });
        describe("Success Scenarios", () => {
            describe("Sequential > Sequential", () => {
                it("should send a request", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName
                        }
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        toDataSetName
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                        ZosmfHeaders.ACCEPT_ENCODING
                    ];

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName } }
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                });
                it("should send a request with timeout", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "responseTimeout": 10,
                        "from-dataset": {
                            dsn: fromDataSetName
                        }
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        toDataSetName
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                        ZosmfHeaders.ACCEPT_ENCODING,
                        { "X-IBM-Response-Timeout": "10"}
                    ];

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName }, responseTimeout: 10 }
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                });
            });
            describe("Member > Member", () => {
                it("should send a request", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName,
                            member: fromMemberName
                        }
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `${toDataSetName}(${toMemberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                        ZosmfHeaders.ACCEPT_ENCODING
                    ];

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName, member: toMemberName },
                        { "from-dataset": { dsn: fromDataSetName, member: fromMemberName } }
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                });
                it("should send a request with a timeout", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "responseTimeout": 10,
                        "from-dataset": {
                            dsn: fromDataSetName,
                            member: fromMemberName
                        }
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `${toDataSetName}(${toMemberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                        ZosmfHeaders.ACCEPT_ENCODING,
                        { "X-IBM-Response-Timeout": "10" }
                    ];

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName, member: toMemberName },
                        { "from-dataset": { dsn: fromDataSetName, member: fromMemberName }, responseTimeout: 10 }
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                });
            });
            describe("Sequential > Member", () => {
                it("should send a request", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName
                        }
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `${toDataSetName}(${toMemberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                        ZosmfHeaders.ACCEPT_ENCODING
                    ];

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName, member: toMemberName },
                        { "from-dataset": { dsn: fromDataSetName} }
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                });
                it("should send a request with a timeout", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "responseTimeout": 10,
                        "from-dataset": {
                            dsn: fromDataSetName
                        }
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `${toDataSetName}(${toMemberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                        ZosmfHeaders.ACCEPT_ENCODING,
                        { "X-IBM-Response-Timeout": "10" }
                    ];

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName, member: toMemberName },
                        { "from-dataset": { dsn: fromDataSetName}, responseTimeout: 10 }
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                });
            });
            describe("Member > Sequential", () => {
                it("should send a request", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName,
                            member: fromMemberName
                        }
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        toDataSetName
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                        ZosmfHeaders.ACCEPT_ENCODING
                    ];

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName, member: fromMemberName } }
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                });
                it("should send a request with a timeout", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "responseTimeout": 10,
                        "from-dataset": {
                            dsn: fromDataSetName,
                            member: fromMemberName
                        }
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        toDataSetName
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                        ZosmfHeaders.ACCEPT_ENCODING,
                        { "X-IBM-Response-Timeout": "10" }
                    ];

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName, member: fromMemberName }, responseTimeout: 10 }
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                });
            });
            describe("enq option", () => {
                it("should not contain enq in payload", async () => {
                    await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName } }
                    );

                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    const argumentsOfCall = copyExpectStringSpy.mock.calls[0];
                    const lastArgumentOfCall = argumentsOfCall[argumentsOfCall.length - 1];
                    expect(lastArgumentOfCall).not.toHaveProperty("enq");
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                });
                it("should contain valid enq value in payload", async () => {
                    await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        {
                            "from-dataset": { dsn: fromDataSetName },
                            "enq": "SHR"
                        }
                    );

                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    const argumentsOfCall = copyExpectStringSpy.mock.calls[0];
                    const lastArgumentOfCall = argumentsOfCall[argumentsOfCall.length - 1];
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(lastArgumentOfCall).toHaveProperty("enq", "SHR");
                });
                it("should contain invalid enq value in payload", async () => {
                    await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        {
                            "from-dataset": { dsn: fromDataSetName },
                            "enq": "AnyThing"
                        }
                    );

                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    const argumentsOfCall = copyExpectStringSpy.mock.calls[0];
                    const lastArgumentOfCall = argumentsOfCall[argumentsOfCall.length - 1];
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(lastArgumentOfCall).toHaveProperty("enq", "AnyThing");
                });
            });
            describe("Replace option", () => {
                it("should not contain replace in payload", async () => {
                    await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName } }
                    );

                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    const argumentsOfCall = copyExpectStringSpy.mock.calls[0];
                    const lastArgumentOfCall = argumentsOfCall[argumentsOfCall.length - 1];
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(lastArgumentOfCall).not.toHaveProperty("replace");
                });
                it("should contain replace with value true in payload", async () => {
                    await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        {
                            "from-dataset": { dsn: fromDataSetName },
                            "replace": true
                        }
                    );

                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    const argumentsOfCall = copyExpectStringSpy.mock.calls[0];
                    const lastArgumentOfCall = argumentsOfCall[argumentsOfCall.length - 1];
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(lastArgumentOfCall).toHaveProperty("replace", true);
                });
                it("should contain replace with value false in payload", async () => {
                    await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        {
                            "from-dataset": { dsn: fromDataSetName },
                            "replace": false
                        }
                    );

                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    const argumentsOfCall = copyExpectStringSpy.mock.calls[0];
                    const lastArgumentOfCall = argumentsOfCall[argumentsOfCall.length - 1];
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(lastArgumentOfCall).toHaveProperty("replace", false);
                });
            });
            describe("Safe replace option", () => {
                it("should not throw error if safeReplace has value of true", async () => {
                    promptFn.mockResolvedValue(true);

                    const startBar = jest.fn();
                    const endBar = jest.fn();
                    const mockProgress = { startBar, endBar};

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName },
                            safeReplace: true,
                            promptFn,
                            progress: mockProgress }
                    );
                    expect(startBar).toHaveBeenCalled();
                    expect(endBar).toHaveBeenCalled();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    const argumentsOfCall = copyExpectStringSpy.mock.calls[0];
                    const lastArgumentOfCall = argumentsOfCall[argumentsOfCall.length - 1];
                    expect(lastArgumentOfCall).toHaveProperty("safeReplace", true);
                    expect(response).toEqual({success: true, commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message});
                    expect(promptFn).toHaveBeenCalledWith(toDataSetName);
                });

                it("should throw error if user declines to replace the dataset", async () => {
                    promptFn.mockResolvedValue(false);
                    const startBar = jest.fn();
                    const endBar = jest.fn();

                    await expect(Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName },
                            safeReplace: true,
                            promptFn,
                            progress: undefined}
                    )).rejects.toThrow(new ImperativeError({ msg: ZosFilesMessages.datasetCopiedAborted.message }));

                    expect(startBar).not.toHaveBeenCalled();
                    expect(startBar).not.toHaveBeenCalled();
                    expect(promptFn).toHaveBeenCalledWith(toDataSetName);

                });

                it("should not throw error if safeReplace has value of false", async () => {
                    await expect(Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName },
                            safeReplace: false,
                        }
                    )).resolves.not.toThrow();
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    const argumentsOfCall = copyExpectStringSpy.mock.calls[0];
                    const lastArgumentOfCall = argumentsOfCall[argumentsOfCall.length - 1];
                    expect(lastArgumentOfCall).toHaveProperty("safeReplace", false);
                });

            });
            describe("Partitioned > Partitioned", () => {
                const startBar = jest.fn();
                const endBar = jest.fn();
                const mockProgress = { startBar, endBar};
                let createSpy: jest.SpyInstance;
                let dataSetExistsSpy: jest.SpyInstance;
                const sourceResponse = {
                    apiResponse: {
                        items: [
                            { member: "mem1" },
                            { member: "mem2" },
                        ]
                    }
                };
                beforeEach(() => {
                    isPDSSpy.mockClear().mockResolvedValue(true);
                    copyPDSSpy.mockClear().mockResolvedValue({success: true, commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message});
                    createSpy = jest.spyOn(Create, "dataSetLike").mockResolvedValue({
                        success: true,
                        commandResponse: ZosFilesMessages.dataSetCreatedSuccessfully.message
                    });
                    dataSetExistsSpy = jest.spyOn(Copy as any, "dataSetExists");
                    listAllMembersSpy.mockImplementation(async (): Promise<any>  => sourceResponse);
                });
                afterAll(() => {
                    copyPDSSpy.mockRestore();
                });
                afterEach(() => {
                    createSpy.mockRestore();
                    dataSetExistsSpy.mockRestore();
                });
                it("should call copyPDS to copy members of source PDS to target PDS", async () => {
                    const response = await Copy.dataSet(
                        dummySession,
                        {dsn: toDataSetName},
                        {"from-dataset": {
                            dsn:fromDataSetName
                        },
                        progress: mockProgress}
                    );
                    expect(startBar).toHaveBeenCalled();
                    expect(endBar).toHaveBeenCalled();
                    expect(isPDSSpy).toHaveBeenNthCalledWith(1, dummySession, fromDataSetName);
                    expect(isPDSSpy).toHaveBeenNthCalledWith(2, dummySession, toDataSetName);
                    expect(copyPDSSpy).toHaveBeenCalledTimes(1);
                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                });
                it("should not call copyPDS to copy members of source PDS to target PDS if member is specified", async() => {
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName,
                            member: fromMemberName
                        }
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `${toDataSetName}(${toMemberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                        ZosmfHeaders.ACCEPT_ENCODING
                    ];

                    const response = await Copy.dataSet(
                        dummySession,
                        {dsn: toDataSetName, member: toMemberName},
                        {"from-dataset": {
                            dsn: fromDataSetName,
                            member: fromMemberName
                        }}
                    );

                    expect(isPDSSpy).not.toHaveBeenCalled();
                    expect(copyPDSSpy).not.toHaveBeenCalled();
                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                });
                it("should call Create.dataSetLike and create a new data set if the target data set inputted does not exist", async() => {
                    dataSetExistsSpy.mockResolvedValue(false);
                    const response = await Copy.dataSet(
                        dummySession,
                        {dsn: toDataSetName},
                        {"from-dataset": {
                            dsn:fromDataSetName
                        }}
                    );
                    expect(createSpy).toHaveBeenCalled();
                    expect(response).toEqual({
                        success: true,
                        commandResponse: util.format(ZosFilesMessages.dataSetCopiedIntoNew.message, toDataSetName)
                    });
                });
                it("should not create a new data set if the target data set inputted exists", async() => {
                    dataSetExistsSpy.mockResolvedValue(true);
                    const response = await Copy.dataSet(
                        dummySession,
                        {dsn: toDataSetName},
                        {"from-dataset": {
                            dsn:fromDataSetName
                        }}
                    );
                    expect(createSpy).not.toHaveBeenCalled();
                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                });
                it("should display a prompt for identical member names if there are identical member names and" +
                    "--safe-replace and --replace flags are not used", async () => {
                    hasIdenticalMemberNames.mockResolvedValue(true);
                    promptForIdenticalNamedMembers.mockClear().mockResolvedValue(true);

                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName },
                            safeReplace: false,
                            replace: false,
                            promptForIdenticalNamedMembers }
                    );
                    expect(promptForIdenticalNamedMembers).toHaveBeenCalledWith();
                    expect(response.success).toEqual(true);

                });
                it("should not display a prompt for identical member names if there are no identical member names", async () => {
                    const response = await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName },
                            safeReplace: false,
                            replace: false,
                            promptForIdenticalNamedMembers }
                    );
                    expect(response.success).toEqual(true);
                    expect(promptForIdenticalNamedMembers).not.toHaveBeenCalled();
                });
                it("should throw error if user declines to replace the dataset", async () => {
                    hasIdenticalMemberNames.mockResolvedValue(true);
                    promptForIdenticalNamedMembers.mockClear().mockResolvedValue(false);

                    await expect(Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName },
                            safeReplace: false,
                            replace: false,
                            promptForIdenticalNamedMembers }
                    )).rejects.toThrow(new ImperativeError({ msg: ZosFilesMessages.datasetCopiedAborted.message }));

                    expect(promptForIdenticalNamedMembers).toHaveBeenCalled();
                });
            });
            it("should return early if the source and target data sets are identical", async () => {
                const response = await Copy.dataSet(
                    dummySession,
                    {dsn: fromDataSetName},
                    {"from-dataset": {
                        dsn: fromDataSetName
                    }}
                );

                expect(response).toEqual({
                    success: false,
                    commandResponse: `The source and target data sets are identical.`
                });
            });
        });
        describe("Failure Scenarios", () => {
            it("should fail if the zOSMF REST client fails", async () => {
                let error;
                const errorMessage = "Dummy error message";

                copyExpectStringSpy.mockImplementation(() => {
                    throw new ImperativeError({ msg: errorMessage });
                });

                const expectedPayload = {
                    "request": "copy",
                    "from-dataset": {
                        dsn: fromDataSetName
                    }
                };
                const expectedEndpoint = posix.join(
                    ZosFilesConstants.RESOURCE,
                    ZosFilesConstants.RES_DS_FILES,
                    toDataSetName
                );
                const expectedHeaders = [
                    { "Content-Type": "application/json" },
                    { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ZosmfHeaders.ACCEPT_ENCODING
                ];
                try {
                    await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: fromDataSetName } }
                    );
                } catch (err) {
                    error = err;
                }
                expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                    dummySession,
                    expectedEndpoint,
                    expectedHeaders,
                    expectedPayload
                );
                expect(error.message).toContain(errorMessage);
            });
            it("should fail if an empty data set name is supplied", async () => {
                let error;

                try {
                    await Copy.dataSet(
                        dummySession,
                        { dsn: toDataSetName },
                        { "from-dataset": { dsn: "" } }
                    );
                } catch (err) {
                    error = err;
                }

                expect(error.message).toContain("Required parameter 'fromDataSetName' must not be blank");
            });
            it("should fail if an undefined data set name is supplied", async () => {
                let error;

                try {
                    await Copy.dataSet(
                        dummySession,
                        { dsn: undefined },
                        { "from-dataset": { dsn: fromDataSetName } }
                    );
                } catch (err) {
                    error = err;
                }

                expect(error.message).toContain("Required object must be defined");
            });
        });
    });

    describe("Partitioned Data Set", () => {
        const listAllMembersSpy   = jest.spyOn(List, "allMembers");
        const downloadAllMembersSpy = jest.spyOn(Download, "allMembers");
        const uploadSpy = jest.spyOn(Upload, "streamToDataSet");
        const fileListPathSpy = jest.spyOn(ZosFilesUtils, "getFileListFromPath");
        const generateMemName = jest.spyOn(ZosFilesUtils, "generateMemberName");
        const fromDataSetName = "USER.DATA.FROM";
        const toDataSetName = "USER.DATA.TO";
        const readStream = jest.spyOn(IO, "createReadStream");
        const rmSync = jest.spyOn(fs, "rmSync");
        const listDatasetSpy = jest.spyOn(List, "dataSet");
        const hasIdenticalMemberNames = jest.spyOn(Copy as any, "hasIdenticalMemberNames");

        beforeEach(() => {
            hasIdenticalMemberNames.mockRestore();
        });

        const dsPO = {
            dsname: fromDataSetName,
            dsorg: "PO",
        };
        const dsPS = {
            dsname: fromDataSetName,
            dsorg: "PS",
        };

        it("should detect PDS datasets correctly during copy", async () => {
            let response;
            listDatasetSpy.mockImplementation(async (): Promise<any>  => {
                return {
                    apiResponse: {
                        items: [dsPO]
                    }
                };
            });
            try {
                response = await Copy.isPDS(dummySession, dsPO.dsname);
            }
            catch(e) {
                // Do nothing
            }
            expect(response).toEqual(true);
            expect(listDatasetSpy).toHaveBeenCalledWith(dummySession, dsPO.dsname, { attributes: true });
        });

        it("should return false if the data set is not partitioned", async () => {
            let response;
            listDatasetSpy.mockImplementation(async (): Promise<any>  => {
                return {
                    apiResponse: {
                        items: [dsPS]
                    }
                };
            });
            try {
                response = await Copy.isPDS(dummySession, dsPS.dsname);
            }
            catch(e) {
                // Do nothing
            }
            expect(response).toEqual(false);
            expect(listDatasetSpy).toHaveBeenCalledWith(dummySession, dsPS.dsname, { attributes: true });
        });
        it("should return true if the data set exists", async () => {
            let response;
            listDatasetSpy.mockImplementation(async (): Promise<any>  => {
                return {
                    apiResponse: {
                        returnedRows: 1,
                        items: [dsPO]
                    }
                };
            });
            try {
                response = await (Copy as any).dataSetExists(dummySession, dsPO.dsname);
            }
            catch(e) {
                // Do nothing
            }
            expect(response).toEqual(true);
            expect(listDatasetSpy).toHaveBeenCalledWith(dummySession, dsPO.dsname, {start: dsPO.dsname});
        });

        it("should return false if the data set does not exist", async () => {
            let response;
            listDatasetSpy.mockImplementation(async (): Promise<any>  => {
                return {
                    apiResponse: {
                        returnedRows: 0,
                        items: []
                    }
                };
            });
            try {
                response = await (Copy as any).dataSetExists(dummySession, dsPO.dsname);
            }
            catch(e) {
                // Do nothing
            }
            expect(response).toEqual(false);
            expect(listDatasetSpy).toHaveBeenCalledWith(dummySession, dsPO.dsname, {start: dsPO.dsname});
        });
        it("should successfully copy members from source to target PDS", async () => {
            let response;
            const sourceResponse = {
                apiResponse: {
                    items: [
                        { member: "mem1" },
                        { member: "mem2" },
                    ]
                }
            };
            const sourceMemberList = sourceResponse.apiResponse.items.map((item: { member: any; }) => item.member);
            const fileList = ["mem1", "mem2"];
            listAllMembersSpy.mockImplementation(async (): Promise<any>  => sourceResponse);
            downloadAllMembersSpy.mockImplementation(async (): Promise<any> => undefined);
            fileListPathSpy.mockReturnValue(fileList);
            generateMemName.mockReturnValue("mem1");
            readStream.mockReturnValue("test" as any);
            uploadSpy.mockResolvedValue(undefined);
            rmSync.mockImplementation(jest.fn());


            try{
                response = await Copy.copyPDS(dummySession, sourceMemberList, fromDataSetName, toDataSetName, task);
            }
            catch(e) {
                // Do nothing
            }
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, fromDataSetName);
            expect(downloadAllMembersSpy).toHaveBeenCalledWith(dummySession, fromDataSetName, expect.any(Object));
            expect(fileListPathSpy).toHaveBeenCalled();
            expect(uploadSpy).toHaveBeenCalledTimes(fileList.length);
            expect(rmSync).toHaveBeenCalled();
            expect(response).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message,
            });
        });
        it("should handle truncation errors and log them to a file", async () => {
            const truncatedMembersFilePath = path.join(tmpdir(), "truncatedMembers.txt");
            let response;
            const sourceResponse = {
                apiResponse: {
                    items: [
                        { member: "mem1" },
                        { member: "mem2" },
                    ]
                }
            };
            const fileList = ["mem1", "mem2"];
            const sourceMemberList = sourceResponse.apiResponse.items.map((item: { member: any; }) => item.member);
            const firstTenMembers = fileList.slice(0, 10);
            listAllMembersSpy.mockImplementation(async (): Promise<any>  => sourceResponse);
            downloadAllMembersSpy.mockImplementation(async (): Promise<any> => undefined);
            fileListPathSpy.mockReturnValue(fileList);
            generateMemName.mockImplementation((m) => m);
            readStream.mockReturnValue("test" as any);
            const numMembers = fileList.length - firstTenMembers.length;

            uploadSpy.mockImplementation((dummySession, readStream, dsn) => {
                if (["mem1", "mem2"].some(m => dsn.includes(m))) {
                    return Promise.reject(new Error("Truncation of a record occurred during an I/O operation"));
                }
                return Promise.resolve() as any;
            });
            try{
                response = await Copy.copyPDS(dummySession, sourceMemberList, fromDataSetName, toDataSetName, task);
            }
            catch(e) {
                // Do nothing
            }
            expect(response.commandResponse).toContain(ZosFilesMessages.datasetCopiedSuccessfully.message + " " +
                ZosFilesMessages.membersContentTruncated.message + "\n" +
                firstTenMembers.join('\n') +
                (numMembers > 0 ? `\n... and ${numMembers} more` +
                    util.format(ZosFilesMessages.viewMembersListfile.message, truncatedMembersFilePath) : ''));
        });

        describe("hasIdenticalMemberNames", () => {
            const listAllMembersSpy = jest.spyOn(List, "allMembers");

            beforeEach(() => {
                jest.clearAllMocks();
            });
            it("should return true if the source and target have identical member names", async () => {
                const sourceResponse = {
                    apiResponse: {
                        items: [
                            { member: "mem1" },
                            { member: "mem2" },
                        ]
                    }
                };
                const targetResponse = {
                    apiResponse: {
                        items: [
                            { member: "mem1" },
                        ]
                    }
                };
                listAllMembersSpy.mockImplementation(async (session, dsName): Promise<any> => {
                    if (dsName === fromDataSetName) {
                        return sourceResponse;
                    } else if (dsName === toDataSetName) {
                        return targetResponse;
                    }
                });
                const sourceMemberList = sourceResponse.apiResponse.items.map((item: { member: any; }) => item.member);
                const response = await Copy["hasIdenticalMemberNames"](dummySession, sourceMemberList, toDataSetName);
                expect(response).toBe(true);
                expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, toDataSetName);
            });
            it("should return false if the source and target do not have identcal member names", async () => {
                const sourceResponse = {
                    apiResponse: {
                        items: [
                            { member: "mem1" },
                            { member: "mem2" },
                        ]
                    }
                };
                const targetResponse = {
                    apiResponse: {
                        items: [
                            { member: "mem3" },
                        ]
                    }
                };
                listAllMembersSpy.mockImplementation(async (_session, dsName): Promise<any> => {
                    if (dsName === fromDataSetName) {
                        return sourceResponse;
                    } else if (dsName === toDataSetName) {
                        return targetResponse;
                    }
                });
                const sourceMemberList = sourceResponse.apiResponse.items.map((item: { member: any; }) => item.member);
                const response = await Copy["hasIdenticalMemberNames"](dummySession, sourceMemberList, toDataSetName);

                expect(response).toBe(false);
                expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, toDataSetName);
            });
        });
    });

    describe("Data Set Cross LPAR", () => {
        const getDatasetSpy    = jest.spyOn(Get, "dataSet");
        const listDatasetSpy   = jest.spyOn(List, "dataSet");
        const listAllMembersSpy   = jest.spyOn(List, "allMembers");
        const createDatasetSpy = jest.spyOn(Create, "dataSet");
        const uploadDatasetSpy = jest.spyOn(Upload, "bufferToDataSet");

        const psDataSetName = "TEST.PS.DATA.SET";
        const memberName    = "mem1";
        const poDataSetName = "TEST.PO.DATA.SET";
        const defaultReturn: IZosFilesResponse = {
            success        : true,
            commandResponse: "Data set copied successfully."
        };
        const dataSetPS = {
            dsname: psDataSetName,
            dsorg: "PS",
            spacu: "TRK"
        };

        const dataSetPO = {
            dsname: poDataSetName,
            dsorg: "PO",
            spacu: "TRK"
        };

        const dataSetPOCYL = {
            dsname: poDataSetName,
            dsorg: "PO",
            spacu: "CYL"
        };

        beforeEach(() => {
            getDatasetSpy.mockClear();
            listDatasetSpy.mockClear();
            createDatasetSpy.mockClear();
            uploadDatasetSpy.mockClear();
            listAllMembersSpy.mockClear();
            getDatasetSpy.mockImplementation(async (): Promise<any>  => defaultReturn);
            listDatasetSpy.mockResolvedValue({} as any);
            listAllMembersSpy.mockImplementation(async (): Promise<any>  => defaultReturn);
            createDatasetSpy.mockImplementation(async (): Promise<any>  => defaultReturn);
            uploadDatasetSpy.mockImplementation(async (): Promise<any>  => defaultReturn);
        });

        describe("Success Scenarios", () => {
            describe("Sequential > Sequential", () => {
                it("should send a request", async () => {
                    listDatasetSpy.mockImplementation(async (): Promise<any>  => {
                        return {
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPS]
                            }
                        };
                    });
                    getDatasetSpy.mockImplementation(async (): Promise<any>  => {
                        return Buffer.from("123456789abcd");
                    });


                    const response = await Copy.dataSetCrossLPAR(
                        dummySession,
                        { dsn: psDataSetName },
                        { "from-dataset": { dsn: dataSetPS.dsname }, replace: true},
                        { },
                        dummySession
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });

                    expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                    expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                    expect(uploadDatasetSpy).toHaveBeenCalledTimes(1);
                });
            });

            describe("Sequential > Sequential - no replace", () => {
                it("should send a request", async () => {
                    let caughtError;
                    listDatasetSpy.mockImplementation(async (): Promise<any>  => {
                        return {
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPS]
                            }
                        };
                    });
                    getDatasetSpy.mockImplementation(async (): Promise<any>  => {
                        return Buffer.from("123456789abcd");
                    });

                    try {
                        await Copy.dataSetCrossLPAR(
                            dummySession,
                            { dsn: psDataSetName },
                            { "from-dataset": { dsn: dataSetPS.dsname }, replace: false},
                            { },
                            dummySession
                        );
                    } catch (e) {
                        caughtError = e;
                    }

                    expect(caughtError).toBeDefined();
                    expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                    expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                    expect(uploadDatasetSpy).toHaveBeenCalledTimes(0);
                });
            });

            describe("Member > Member", () => {
                it("should send a request", async () => {
                    let response;

                    listDatasetSpy.mockImplementation(async (): Promise<any>  => {
                        return {
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPO]
                            }
                        };
                    });
                    listAllMembersSpy.mockImplementation(async (): Promise<any>  => {
                        return {
                            apiResponse: {
                                returnedRows: 1
                            }
                        };
                    });
                    try {
                        response = await Copy.dataSetCrossLPAR(
                            dummySession,
                            { dsn: poDataSetName, member: memberName },
                            { "from-dataset": { dsn: poDataSetName, member: memberName}, replace: true},
                            { },
                            dummySession
                        );
                    } catch (e) {
                        // Do nothing
                    }

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });

                    expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                    expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
                    expect(listAllMembersSpy.mock.calls[0][2].start).toBe(memberName);
                    expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                    expect(uploadDatasetSpy).toHaveBeenCalledTimes(1);
                });

                it("should send a request - TRK and validate spacu", async () => {
                    listDatasetSpy.mockImplementation(async (): Promise<any> => {
                        return {
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPO],
                            }
                        };
                    });

                    listAllMembersSpy.mockImplementation(async (): Promise<any> => {
                        return {
                            apiResponse: {
                                returnedRows: 1
                            }
                        };
                    });

                    const response = await Copy.dataSetCrossLPAR(
                        dummySession,
                        { dsn: poDataSetName, member: memberName },
                        { "from-dataset": { dsn: poDataSetName, member: memberName }, replace: true },
                        {},
                        dummySession);

                    // Assertions
                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });

                    expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                    expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
                    expect(listAllMembersSpy.mock.calls[0][2].start).toBe(memberName);
                    expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                    expect(uploadDatasetSpy).toHaveBeenCalledTimes(1);
                    expect(dataSetPO.spacu).toBe("TRK");
                });

                it("should send a request - CYL and validate spacu", async () => {
                    listDatasetSpy.mockImplementation(async (): Promise<any> => {
                        return {
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPOCYL],
                            }
                        };
                    });

                    listAllMembersSpy.mockImplementation(async (): Promise<any> => {
                        return {
                            apiResponse: {
                                returnedRows: 1
                            }
                        };
                    });


                    const response = await Copy.dataSetCrossLPAR(
                        dummySession,
                        { dsn: poDataSetName, member: memberName },
                        { "from-dataset": { dsn: poDataSetName, member: memberName }, replace: true },
                        {},
                        dummySession
                    );


                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });

                    expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                    expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
                    expect(listAllMembersSpy.mock.calls[0][2].start).toBe(memberName);
                    expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                    expect(uploadDatasetSpy).toHaveBeenCalledTimes(1);
                    expect(dataSetPOCYL.spacu).toBe("CYL");
                });

                describe("Sequential > Member", () => {
                    it("should send a request", async () => {

                        listDatasetSpy.mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPS]
                            }
                        } as any).mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPO]
                            }
                        } as any);
                        listAllMembersSpy.mockImplementation(async (): Promise<any>  => {
                            return {
                                apiResponse: {
                                    returnedRows: 1
                                }
                            };
                        });

                        const response = await Copy.dataSetCrossLPAR(
                            dummySession,
                            { dsn: poDataSetName, member: memberName },
                            { "from-dataset": { dsn: psDataSetName }, replace: true},
                            { },
                            dummySession
                        );


                        expect(response).toEqual({
                            success: true,
                            commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                        });

                        expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                        expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
                        expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                        expect(uploadDatasetSpy).toHaveBeenCalledTimes(1);
                    });
                });
                describe("Member > Sequential", () => {
                    it("should send a request", async () => {
                        let response;

                        listDatasetSpy.mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPO]
                            }
                        } as any).mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPS]
                            }
                        } as any);

                        try {
                            response = await Copy.dataSetCrossLPAR(
                                dummySession,
                                { dsn: psDataSetName },
                                { "from-dataset": { dsn: poDataSetName, member: memberName}, replace: true},
                                { },
                                dummySession
                            );
                        } catch (e) {
                            // Do nothing
                        }

                        expect(response).toEqual({
                            success: true,
                            commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                        });

                        expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                        expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                        expect(uploadDatasetSpy).toHaveBeenCalledTimes(1);
                    });
                });

                describe("Sequential > Sequential - create target", () => {
                    it("should send a request", async () => {
                        let response;
                        let caughtError;

                        listDatasetSpy.mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPS]
                            }
                        } as any).mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 0,
                            }
                        } as any);
                        try {
                            response = await Copy.dataSetCrossLPAR(
                                dummySession,
                                { dsn: psDataSetName },
                                { "from-dataset": { dsn: psDataSetName }},
                                { },
                                dummySession
                            );
                        } catch (e) {
                            caughtError = e;
                            error("caughtError = " + caughtError.message);
                        }

                        expect(response).toEqual({
                            success: true,
                            commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                        });

                        expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                        expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                        expect(createDatasetSpy).toHaveBeenCalledTimes(1);
                    });
                });

                describe("Sequential > Member - create target", () => {
                    it("should send a request", async () => {
                        let response;

                        listDatasetSpy.mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPS]
                            }
                        } as any).mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 0,
                            }
                        } as any);

                        try {
                            response = await Copy.dataSetCrossLPAR(
                                dummySession,
                                { dsn: psDataSetName, member: memberName },
                                { "from-dataset": { dsn: psDataSetName }},
                                { },
                                dummySession
                            );
                        } catch (e) {
                            // Do nothing
                        }

                        expect(response).toEqual({
                            success: true,
                            commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                        });

                        expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                        expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                        expect(createDatasetSpy).toHaveBeenCalledTimes(1);
                    });
                });
                describe("Member > Sequential - create target", () => {
                    it("should send a request", async () => {
                        let response;

                        listDatasetSpy.mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 1,
                                items: [dataSetPO]
                            }
                        } as any).mockReturnValueOnce({
                            apiResponse: {
                                returnedRows: 0
                            }
                        } as any);
                        try {
                            response = await Copy.dataSetCrossLPAR(
                                dummySession,
                                { dsn: psDataSetName },
                                { "from-dataset": { dsn: poDataSetName, member: memberName}},
                                { },
                                dummySession
                            );
                        } catch (e) {
                            // Do nothing
                        }

                        expect(response).toEqual({
                            success: true,
                            commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                        });

                        expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                        expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                        expect(createDatasetSpy).toHaveBeenCalledTimes(1);
                    });
                });
            });
        });
    });
});
