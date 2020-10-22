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

import { List } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

describe("List Dataset handler", () => {
    describe("process method", () => {
        it("should list a data set if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/list/ds/DataSet.handler");
            const handler = new handlerReq.default();
            const dataSetName = "testing";

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            List.dataSet = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "listed",
                    apiResponse: {
                        items: ["test-items"]
                    }
                };
            });

            // Mocked function references
            const profFunc = jest.fn((args) => {
                return {
                    host: "fake",
                    port: "fake",
                    user: "fake",
                    password: "fake",
                    auth: "fake",
                    rejectUnauthorized: "fake"
                };
            });

            // Invoke the handler with a full set of mocked arguments and response functions
            await handler.process({
                arguments: {
                    $0: "fake",
                    _: ["fake"],
                    dataSetName,
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
                },
                profiles: {
                    get: profFunc
                }
            } as any);

            expect(profFunc).toHaveBeenCalledWith("zosmf", false);
            expect(List.dataSet).toHaveBeenCalledTimes(1);
            expect(List.dataSet).toHaveBeenCalledWith(fakeSession, dataSetName, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
