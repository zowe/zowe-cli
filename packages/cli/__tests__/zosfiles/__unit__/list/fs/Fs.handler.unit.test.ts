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
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

describe("fs handler", () => {
    describe("process method", () => {
        it("should list all mounted files", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/list/fs/Fs.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the List.fs function
            List.fs = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "listed",
                    apiResponse: {
                        items: ["test-items"]
                    }
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        // path,
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
                            startBar: jest.fn((_parms) => {
                                // do nothing
                            }),
                            endBar: jest.fn(() => {
                                // do nothing
                            })
                        }
                    }
                } as any);
            } catch (e) {
                // Do nothing
            }

            //            expect(error).toBeUndefined();
            expect(List.fs).toHaveBeenCalledTimes(1);
            expect(List.fs).toHaveBeenCalledWith(fakeSession, {fsname: undefined, maxLength: undefined, path: null});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should list all mounted files using path", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/list/fs/Fs.handler");
            const handler = new handlerReq.default();
            const path = "testing";

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the List.fs function
            List.fsWithPath = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "listed",
                    apiResponse: {
                        items: ["test-items"]
                    }
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        path,
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
                            startBar: jest.fn((_parms) => {
                                // do nothing
                            }),
                            endBar: jest.fn(() => {
                                // do nothing
                            })
                        }
                    }
                } as any);
            } catch (e) {
                // Do nothing
            }

            //            expect(error).toBeUndefined();
            expect(List.fsWithPath).toHaveBeenCalledTimes(1);
            expect(List.fsWithPath).toHaveBeenCalledWith(fakeSession, {fsname: null, maxLength: undefined, path: "testing"});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
