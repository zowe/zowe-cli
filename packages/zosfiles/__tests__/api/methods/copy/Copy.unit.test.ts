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

import { Session, ImperativeError } from "@zowe/imperative";
import { posix } from "path";
import { Copy, ZosFilesConstants, ZosFilesMessages, ICopyDatasetOptions, enqueue } from "../../../../";

import { ZosmfRestClient } from "../../../../../rest";

describe("Copy Dataset", () => {
    const copyExpectStringSpy = jest.spyOn(ZosmfRestClient, "putExpectString");
    const dummySession = new Session({
        user: "dummy",
        password: "dummy",
        hostname: "machine",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    beforeEach(() => {
        copyExpectStringSpy.mockClear();
        copyExpectStringSpy.mockImplementation(async () => {
            return "";
        });
    });

    describe("Catalogued", () => {
        describe("Sequential", () => {
            describe("Success Scenarios", () => {
                const fromDataSetName = "USER.DATA.FROM";
                const toDataSetName = "USER.DATA.TO";

                it("should send a request", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName,
                        },
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        toDataSetName
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    const response = await Copy.dataSet(dummySession, fromDataSetName, toDataSetName);

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

                it("should send a request with enqueue type: SHR", async () => {
                    const options: ICopyDatasetOptions = { enq: enqueue.SHR };

                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName,
                        },
                        "enq": "SHR",
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        toDataSetName
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    const response = await Copy.dataSet(dummySession, fromDataSetName, toDataSetName, options);

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

                it("should send a request with alias = true", async () => {
                    const options: ICopyDatasetOptions = { alias: true };

                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName,
                        },
                        "alias": true,
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        toDataSetName
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    const response = await Copy.dataSet(dummySession, fromDataSetName, toDataSetName, options);

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
                it("should send a request with alias = false", async () => {
                    const options: ICopyDatasetOptions = { alias: false };

                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName,
                        },
                        "alias": false,
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        toDataSetName
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    const response = await Copy.dataSet(dummySession, fromDataSetName, toDataSetName, options);

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
            });
            describe("Failure Scenarios", () => {
                const fromDataSetName = "USER.DATA.FROM";
                const toDataSetName = "USER.DATA.TO";
                const errorMessage = "Dummy error message";

                it("should fail if the zOSMF REST client fails", async () => {
                    copyExpectStringSpy.mockImplementation(() => {
                        throw new ImperativeError({msg: errorMessage});
                    });
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName,
                        },
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        toDataSetName
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    let error;
                    try {
                        await Copy.dataSet(dummySession, fromDataSetName, toDataSetName);
                    } catch (err) {
                        error = err.message;
                    }

                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                    expect(error).toContain(errorMessage);
                });
            });
        });
        describe("Partitioned", () => {
            describe("Success Scenarios", () => {
                const fromDsName = "USER.DATA.FROM";
                const toDsName = "USER.DATA.TO";
                const memberName = "MEMBER";

                it("should send a request", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDsName,
                            member: memberName,
                        },
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `${toDsName}(${memberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    const response = await Copy.dataSetMember(
                        dummySession,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                    );

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
                it("should replace like named ds", async () => {
                    const options: ICopyDatasetOptions = { replace: true };
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDsName,
                            member: memberName,
                        },
                        "replace": true,
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `${toDsName}(${memberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    const response = await Copy.dataSetMember(
                        dummySession,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                        options,
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload,
                    );
                });
                it("should send a request with enqueue type: SHRW", async () => {
                    const options: ICopyDatasetOptions = { enq: enqueue.SHRW };
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDsName,
                            member: memberName,
                        },
                        "enq": "SHRW",
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `${toDsName}(${memberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    const response = await Copy.dataSetMember(
                        dummySession,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                        options,
                    );

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });
                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload,
                    );
                });
            });
            describe("Failure Scenarios", () => {
                const fromDsName = "USER.DATA.FROM";
                const toDsName = "USER.DATA.TO";
                const memberName = "MEMBER";
                const errorMessage = "Dummy error message";

                it("should fail if the zOSMF REST client fails", async () => {
                    copyExpectStringSpy.mockImplementation(() => {
                        throw new ImperativeError({msg: errorMessage});
                    });


                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDsName,
                            member: memberName,
                        },
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `${toDsName}(${memberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    let error;
                    try {
                        await Copy.dataSetMember(
                            dummySession,
                            fromDsName,
                            memberName,
                            toDsName,
                            memberName,
                        );
                    } catch (err) {
                        error = err.message;
                    }

                    expect(copyExpectStringSpy).toHaveBeenCalledTimes(1);
                    expect(copyExpectStringSpy).toHaveBeenLastCalledWith(
                        dummySession,
                        expectedEndpoint,
                        expectedHeaders,
                        expectedPayload
                    );
                    expect(error).toContain(errorMessage);
                });
            });
        });
    });
    describe("Uncatalogued", () => {
        describe("Sequential", () => {
            describe("Success Scenarios", () => {
                const fromDataSetName = "USER.DATA.FROM";
                const toDataSetName = "USER.DATA.TO";
                const fromVolume: string = "VOL1";
                const toVolume: string = "VOL2";
                const options: ICopyDatasetOptions = {
                    fromVolume,
                    toVolume,
                };

                it("should send a request", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDataSetName,
                            volser: fromVolume,
                        },
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `-(${toVolume})`,
                        toDataSetName,
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    const response = await Copy.dataSet(dummySession, fromDataSetName, toDataSetName, options);

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
            });
        });
        describe("Partitioned", () => {
            describe("Success Scenarios", () => {
                const fromDsName = "USER.DATA.FROM";
                const toDsName = "USER.DATA.TO";
                const memberName = "MEMBER";
                const fromVolume: string = "VOL1";
                const toVolume: string = "VOL2";
                const options: ICopyDatasetOptions = {
                    fromVolume,
                    toVolume,
                };

                it("should send a request", async () => {
                    const expectedPayload = {
                        "request": "copy",
                        "from-dataset": {
                            dsn: fromDsName,
                            volser: fromVolume,
                            member: memberName,
                        },
                    };
                    const expectedEndpoint = posix.join(
                        ZosFilesConstants.RESOURCE,
                        ZosFilesConstants.RES_DS_FILES,
                        `-(${toVolume})`,
                        `${toDsName}(${memberName})`
                    );
                    const expectedHeaders = [
                        { "Content-Type": "application/json" },
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                    ];

                    const response = await Copy.dataSetMember(
                        dummySession,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                        options,
                    );

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
            });
        });
    });
});
