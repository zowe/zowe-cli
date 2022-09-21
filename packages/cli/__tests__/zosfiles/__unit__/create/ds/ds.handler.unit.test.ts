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

import { Create, CreateDataSetTypeEnum } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

describe("Create data set handler", () => {
    describe("process method", () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/create/ds/ds.handler");
        const handler = new handlerReq.default();
        const dataSetName = "testing";
        const likeDataSetName = "testing";
        const dataSetTypeName = "PDS";

        beforeEach(() => {
            // Mocks need cleared after every test for clean test runs
            jest.resetAllMocks();
        });

        it("should create a  data set if requested", async () => {
            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let AbstractSession = null;

            // Mock the create function
            Create.dataSetLike = jest.fn(async (session) => {
                AbstractSession = session;
                return {
                    success: true,
                    commandResponse: "created"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "abstract",
                        _: ["abstract"],
                        dataSetName,
                        like: likeDataSetName,
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Create.dataSetLike).toHaveBeenCalledTimes(1);
            expect(Create.dataSetLike).toHaveBeenCalledWith(AbstractSession, dataSetName, likeDataSetName,{});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should create a  data set if requested with --data-set-type", async () => {
            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let AbstractSession = null;

            // Mock the create function
            Create.dataSet = jest.fn(async (session) => {
                AbstractSession = session;
                return {
                    success: true,
                    commandResponse: "created"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "abstract",
                        _: ["abstract"],
                        dataSetName,
                        dataSetType: dataSetTypeName,
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Create.dataSet).toHaveBeenCalledTimes(1);
            expect(Create.dataSet).toHaveBeenCalledWith(AbstractSession, CreateDataSetTypeEnum.DATA_SET_BLANK, dataSetName,
                {"dsntype": dataSetTypeName});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
