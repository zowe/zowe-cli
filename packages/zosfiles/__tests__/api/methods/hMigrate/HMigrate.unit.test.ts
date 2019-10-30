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

import { Session } from "@brightside/imperative";
import { posix } from "path";
import { HMigrate, ZosFilesConstants, ZosFilesMessages } from "../../../..";

import { ZosmfRestClient } from "../../../../../rest";
import { Invoke } from "../../../../src/api/methods/invoke";

describe("hMigrate data set", () => {
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

    describe("Success Scenario", () => {
        const dataSetName: string = "EFGH";

        it("should send a request", async () => {
            const expectedPayload = { request: "hmigrate" };

            const expectedEndpoint = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_DS_FILES,
                dataSetName,
                );

            const expectedHeaders = [
                { "Content-Type": "application/json"},
                { "Content-Length": JSON.stringify(expectedPayload).length.toString() },
            ];

            const response = await HMigrate.dataSet(dummySession, dataSetName);

            expect(response).toEqual({
                success: true,
                commandResponse: ZosFilesMessages.datasetMigratedSuccessfully.message,
            });

            expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
            expect(putExpectStringSpy).toHaveBeenLastCalledWith(
                dummySession,
                expectedEndpoint,
                expectedHeaders,
                expectedPayload,
            );
        });
    });
});

