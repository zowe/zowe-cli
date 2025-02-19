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
import { IHandlerParameters } from "@zowe/imperative";

describe("List AllMembers handler", () => {
    const dataSetName = "testing";
    let apiMessage = "";
    let jsonObj: any;
    let logMessage = "";
    const fakeHandlerParms: IHandlerParameters = {
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
                startBar: jest.fn((_parms) => {
                    // do nothing
                }),
                endBar: jest.fn(() => {
                    // do nothing
                })
            }
        }
    } as any;

    describe("process method", () => {
        beforeEach(() => {
            logMessage = "";
        });

        it("should list all members from a PDS if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/list/am/AllMembers.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let fakeSession = null;

            // Mock the submit JCL function
            List.allMembers = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "listed",
                    apiResponse: {
                        items: [{member: "test-item"}]
                    }
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(fakeHandlerParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(List.allMembers).toHaveBeenCalledTimes(1);
            expect(List.allMembers).toHaveBeenCalledWith(fakeSession, dataSetName, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should list all members from a PDS with some errors", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/list/am/AllMembers.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let fakeSession = null;

            // Mock the submit JCL function
            List.allMembers = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "listed",
                    apiResponse: {
                        items: [{member: "test-item"}],
                        returnedRows: 3
                    }
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(fakeHandlerParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(List.allMembers).toHaveBeenCalledTimes(1);
            expect(List.allMembers).toHaveBeenCalledWith(fakeSession, dataSetName, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
