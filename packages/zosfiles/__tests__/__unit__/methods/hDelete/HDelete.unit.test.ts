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

import { Session, ImperativeError } from "@zowe/core-for-zowe-sdk";
import { posix } from "path";
import { HDelete, ZosFilesConstants, ZosFilesMessages } from "../../../../src";

import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IDeleteOptions } from "../../../../src/methods/hDelete/doc/IDeleteOptions";

describe("hDelete data set", () => {
    const putExpectStringSpy = jest.spyOn(ZosmfRestClient, "putExpectString");

    beforeEach(() => {
        putExpectStringSpy.mockClear();
        putExpectStringSpy.mockImplementation(async () => {
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

    describe("Success Scenarios", () => {
        const dataSetName: string = "EFGH";

        it("should send a request", async () => {
            const expectedPayload = { request: "hdelete" };

            const expectedEndpoint = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_DS_FILES,
                dataSetName
            );

            const expectedHeaders = [
                { "Content-Type": "application/json" },
                { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                ZosmfHeaders.ACCEPT_ENCODING
            ];

            const response = await HDelete.dataSet(dummySession, dataSetName);

            expect(response).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetDeletionRequested.message
            });

            expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
            expect(putExpectStringSpy).toHaveBeenLastCalledWith(
                dummySession,
                expectedEndpoint,
                expectedHeaders,
                expectedPayload
            );
        });
        it("should send a request with wait = true", async () => {
            const options: IDeleteOptions = { wait: true };

            const expectedPayload = {
                request: "hdelete",
                wait: true
            };
            const expectedEndpoint = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_DS_FILES,
                dataSetName
            );
            const expectedHeaders = [
                { "Content-Type": "application/json" },
                { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                ZosmfHeaders.ACCEPT_ENCODING
            ];

            const response = await HDelete.dataSet(dummySession, dataSetName, options);

            expect(response).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetDeletionRequested.message
            });
            expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
            expect(putExpectStringSpy).toHaveBeenLastCalledWith(
                dummySession,
                expectedEndpoint,
                expectedHeaders,
                expectedPayload
            );
        });
        it("should send a request with purge = true", async () => {
            const options: IDeleteOptions = { purge: true };

            const expectedPayload = {
                request: "hdelete",
                purge: true
            };
            const expectedEndpoint = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_DS_FILES,
                dataSetName
            );
            const expectedHeaders = [
                { "Content-Type": "application/json" },
                { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                ZosmfHeaders.ACCEPT_ENCODING
            ];

            const response = await HDelete.dataSet(dummySession, dataSetName, options);

            expect(response).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetDeletionRequested.message
            });
            expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
            expect(putExpectStringSpy).toHaveBeenLastCalledWith(
                dummySession,
                expectedEndpoint,
                expectedHeaders,
                expectedPayload
            );
        });
        it("should send a request with responseTimeout", async () => {
            const options: IDeleteOptions = { responseTimeout: 5 };

            const expectedPayload = {
                request: "hdelete"
            };
            const expectedEndpoint = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_DS_FILES,
                dataSetName
            );
            const expectedHeaders = [
                { "Content-Type": "application/json" },
                { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                ZosmfHeaders.ACCEPT_ENCODING,
                { "X-IBM-Response-Timeout": "5" }
            ];

            const response = await HDelete.dataSet(dummySession, dataSetName, options);

            expect(response).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetDeletionRequested.message
            });
            expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
            expect(putExpectStringSpy).toHaveBeenLastCalledWith(
                dummySession,
                expectedEndpoint,
                expectedHeaders,
                expectedPayload
            );
        });
    });
    describe("Failure Scenarios", () => {
        const dataSetName: string = "EFGH";
        const errorMessage = "Dummy error message";

        it("should fail if the zOSMF REST client fails", async () => {
            putExpectStringSpy.mockImplementation(() => {
                throw new ImperativeError({ msg: errorMessage });
            });
            const expectedPayload = { request: "hdelete" };

            const expectedEndpoint = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_DS_FILES,
                dataSetName
            );
            const expectedHeaders = [
                { "Content-Type": "application/json" },
                { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
                ZosmfHeaders.ACCEPT_ENCODING
            ];

            let error;
            try {
                await HDelete.dataSet(dummySession, dataSetName);
            } catch (err) {
                error = err.message;
            }

            expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
            expect(putExpectStringSpy).toHaveBeenLastCalledWith(
                dummySession,
                expectedEndpoint,
                expectedHeaders,
                expectedPayload
            );
            expect(error).toContain(errorMessage);
        });
    });
});
