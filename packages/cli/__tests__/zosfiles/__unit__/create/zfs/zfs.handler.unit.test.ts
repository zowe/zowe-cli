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
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

const message: string = "Dummy error message";

describe("Create z/OS file system handler", () => {
    describe("process method", () => {
        it("should create a ZFS if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/create/zfs/zfs.handler");
            const handler = new handlerReq.default();
            const fileSystemName = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the zfs function
            Create.zfs = jest.fn(async (session) => {
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
                        fileSystemName,
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
            expect(Create.zfs).toHaveBeenCalledTimes(1);
            expect(Create.zfs).toHaveBeenCalledWith(fakeSession, fileSystemName, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });

    it("should raise an error", async () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/create/zfs/zfs.handler");
        const handler = new handlerReq.default();
        const fileSystemName = "testing";

        // Vars populated by the mocked function
        let error: any;
        let fakeSession = null;

        // Mock the zfs function
        Create.zfs = jest.fn((session) => {
            fakeSession = session;
            const impErr = new ImperativeError({
                msg: message
            });
            throw impErr;
        });

        const commandParameters = {
            arguments: {
                $0: "fake",
                _: ["fake"],
                fileSystemName,
                ...UNIT_TEST_ZOSMF_PROF_OPTS,
            },
            response: {
                data: {
                    setMessage: jest.fn((_setMsgArgs) => {
                        // Do nothing
                    }),
                    setObj: jest.fn((_setObjArgs) => {
                        // Do nothing
                    }),
                },
                console: {
                    log: jest.fn((_logArgs) => {
                        // Do nothing
                    }),
                },
                progress: {
                    endBar: jest.fn(), // Mocking progress.endBar here
                },
            },
        };

        try {
            await handler.process(commandParameters);
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(Create.zfs).toHaveBeenCalledTimes(1);
        expect(Create.zfs).toHaveBeenCalledWith(fakeSession, fileSystemName, {});
    });
});
