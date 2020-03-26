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

import { Copy, ZosFilesConstants, ZosFilesMessages } from "../../../..";
import { ZosmfRestClient } from "../../../../../rest";

describe("Copy", () => {
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

    describe("Data Set", () => {
        const fromDataSetName = "USER.DATA.FROM";
        const fromMemberName = "mem1";
        const toDataSetName = "USER.DATA.TO";
        const toMemberName = "mem2";
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
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() }
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
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() }
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
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() }
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
                        { "Content-Length": JSON.stringify(expectedPayload).length.toString() }
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
                    { "Content-Length": JSON.stringify(expectedPayload).length.toString() }
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
});
