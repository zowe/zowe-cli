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

import { Create } from "@zowe/zos-files-for-zowe-sdk";
import { ImperativeError } from "@zowe/imperative";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

const message: string = "Dummy error message";

describe("Create VSAM data set handler", () => {
    describe("process method", () => {
        it("should create a VSAM data set if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/create/vsam/vsam.handler");
            const handler = new handlerReq.default();
            const dataSetName = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the vsam function
            Create.vsam = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "created"
                };
            });

            try {
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
                    }
                } as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Create.vsam).toHaveBeenCalledTimes(1);
            expect(Create.vsam).toHaveBeenCalledWith(fakeSession, dataSetName, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });

    it("should raise an error", async () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/create/vsam/vsam.handler");
        const handler = new handlerReq.default();
        const dataSetName = "testing";

        // Vars populated by the mocked function
        let error: any;
        let apiMessage = "";
        let jsonObj;
        let logMessage = "";
        let fakeSession = null;

        // Mock the vsam function
        Create.vsam = jest.fn((session) => {
            fakeSession = session;
            const impErr = new ImperativeError({
                msg: message
            });
            throw impErr;
        });

        try {
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
                    }
                }
            } as any);
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(Create.vsam).toHaveBeenCalledTimes(1);
        expect(Create.vsam).toHaveBeenCalledWith(fakeSession, dataSetName, {});
    });
});
