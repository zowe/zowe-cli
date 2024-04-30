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


import { Search } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { TaskStage } from "@zowe/imperative";

describe("Search Datasets handler", () => {
    describe("process method", () => {
        it("should search a data set if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/search/ds/DataSets.handler");
            const handler = new handlerReq.default();
            const dataSetName = "TEST*";
            const searchString = "test";

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Search.dataSets = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Found \"test\" in 2 data sets and PDS members",
                    apiResponse: [
                        {
                            dsname: "TEST1.DS",
                            memname: "TESTMEM",
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        },
                        {
                            dsname: "TEST2.DS",
                            memname: undefined,
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        }
                    ]
                };
            });

            // Invoke the handler with a full set of mocked arguments and response functions
            await handler.process({
                arguments: {
                    $0: "fake",
                    _: ["fake"],
                    dataSetName,
                    searchString,
                    ...UNIT_TEST_ZOSMF_PROF_OPTS
                },
                response: {
                    data: {
                        setMessage: jest.fn((setMsgArgs) => {
                            apiMessage = setMsgArgs;
                        }),
                        setObj: jest.fn((setObjArgs) => {
                            jsonObj = setObjArgs;
                        })
                    },
                    console: {
                        log: jest.fn((logArgs) => {
                            logMessage += "\n" + logArgs;
                        })
                    },
                    progress: {
                        startBar: jest.fn((parms) => {
                            // do nothing
                        }),
                        endBar: jest.fn(() => {
                            // do nothing
                        })
                    }
                }
            } as any);

            expect(Search.dataSets).toHaveBeenCalledTimes(1);
            expect(Search.dataSets).toHaveBeenCalledWith(fakeSession, {
                dsn: dataSetName,
                searchString,
                caseSensitive: undefined,
                mainframeSearch: undefined,
                maxConcurrentRequests: undefined,
                timeout: undefined,
                progressTask: {
                    percentComplete: 0,
                    statusMessage: "Starting search...",
                    stageName: TaskStage.NOT_STARTED
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
