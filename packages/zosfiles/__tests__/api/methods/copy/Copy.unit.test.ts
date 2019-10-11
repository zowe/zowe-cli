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
import { Copy, ZosFilesConstants, ZosFilesMessages } from "../../../../";

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
        
                    const apiResponse = await Copy.dataSet(dummySession, fromDataSetName, toDataSetName);
        
                    expect(apiResponse).toEqual({
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
