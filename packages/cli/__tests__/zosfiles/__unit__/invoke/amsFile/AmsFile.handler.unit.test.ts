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

import { Invoke, IZosFilesOptions } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

describe("Invoke AMS files handler", () => {
    describe("process method", () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/invoke/amsFile/AmsFile.handler");
        const handler = new handlerReq.default();
        let fakeSession: any = null;

        beforeEach(() => {
            // Mock the submit JCL function
            Invoke.ams = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "sent",
                    apiResponse: {}
                };
            });
        });

        it("should invoke AMS if requested and read statements from a file", async () => {
            const controlStatementsFile = "testing";
            const options: IZosFilesOptions = {responseTimeout: undefined};

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        controlStatementsFile,
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
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Invoke.ams).toHaveBeenCalledTimes(1);
            expect(Invoke.ams).toHaveBeenCalledWith(fakeSession, controlStatementsFile, options);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
