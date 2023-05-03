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

import { error } from "console";

import { Copy, Create, Get, List, Upload, ZosFilesConstants, ZosFilesMessages, IZosFilesResponse } from "../../../../src";
import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";

describe("Copy", () => {
    const dummySession = new Session({
        user: "dummy",
        password: "dummy",
        hostname: "localhost",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    describe("Data Set", () => {
        const copyExpectStringSpy = jest.spyOn(ZosmfRestClient, "putExpectString");
        const fromDataSetName = "USER.DATA.FROM";
        const fromMemberName = "mem1";
        const toDataSetName = "USER.DATA.TO";
        const toMemberName = "mem2";

        beforeEach(() => {
            copyExpectStringSpy.mockClear();
            copyExpectStringSpy.mockImplementation(async () => {
                return "";
            });
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
                    expect(lastArgumentOfCall).toHaveProperty("replace", false);
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
                    let response;
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
                        response = await Copy.dataSetCrossLPAR(
                            dummySession,
                            { dsn: psDataSetName },
                            { "from-dataset": { dsn: dataSetPS.dsname }, replace: true},
                            { },
                            dummySession
                        );
                    } catch (e) {
                        caughtError = e;
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

            describe("Sequential > Sequential - no replace", () => {
                it("should send a request", async () => {
                    let response;
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
                        response = await Copy.dataSetCrossLPAR(
                            dummySession,
                            { dsn: psDataSetName },
                            { "from-dataset": { dsn: dataSetPS.dsname }, replace: false},
                            { },
                            dummySession
                        );
                    } catch (e) {
                        caughtError = e;
                    }

                    expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                    expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                    expect(uploadDatasetSpy).toHaveBeenCalledTimes(0);
                });
            });

            describe("Member > Member", () => {
                it("should send a request", async () => {
                    let response;
                    let caughtError;

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
                        caughtError = e;
                    }

                    expect(response).toEqual({
                        success: true,
                        commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
                    });

                    expect(listDatasetSpy).toHaveBeenCalledTimes(2);
                    expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
                    expect(getDatasetSpy).toHaveBeenCalledTimes(1);
                    expect(uploadDatasetSpy).toHaveBeenCalledTimes(1);
                });

                describe("Sequential > Member", () => {
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

                        try {
                            response = await Copy.dataSetCrossLPAR(
                                dummySession,
                                { dsn: poDataSetName, member: memberName },
                                { "from-dataset": { dsn: psDataSetName }, replace: true},
                                { },
                                dummySession
                            );
                        } catch (e) {
                            caughtError = e;
                        }

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
                        let caughtError;

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
                            caughtError = e;
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
                                { dsn: psDataSetName, member: memberName },
                                { "from-dataset": { dsn: psDataSetName }},
                                { },
                                dummySession
                            );
                        } catch (e) {
                            caughtError = e;
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
                        let caughtError;

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
                            caughtError = e;
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
