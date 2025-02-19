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

import { Mount } from "@zowe/zos-files-for-zowe-sdk";
import { ImperativeError } from "@zowe/imperative";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

const message: string = "Dummy error message";

describe("Mount file system handler", () => {
    describe("process method", () => {
        it("should mount a FS if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/mount/fs/fs.handler");
            const handler = new handlerReq.default();
            const fileSystemName = "TEST.ZFS";
            const mountPoint = "/u/ibmuser/mount";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the zfs function
            Mount.fs = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "mounted"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        fileSystemName,
                        mountPoint,
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
            expect(Mount.fs).toHaveBeenCalledTimes(1);
            expect(Mount.fs).toHaveBeenCalledWith(fakeSession, fileSystemName, mountPoint, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });

    it("should fail to mount a FS when there is an API error", async () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/mount/fs/fs.handler");
        const handler = new handlerReq.default();
        const fileSystemName = "TEST.ZFS";
        const mountPoint = "/u/ibmuser/mount";

        // Vars populated by the mocked function
        let error: any;
        let fakeSession = null;

        // Mock the fs function
        Mount.fs = jest.fn((session) => {
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
                    fileSystemName,
                    mountPoint,
                    ...UNIT_TEST_ZOSMF_PROF_OPTS
                },
                response: {
                    data: {
                        setMessage: jest.fn((_setMsgArgs) => {
                            // Do nothing
                        }),
                        setObj: jest.fn((_setObjArgs) => {
                            // Do nothing
                        })
                    },
                    console: {
                        log: jest.fn((_logArgs) => {
                            // Do nothing
                        })
                    }
                }
            } as any);
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(Mount.fs).toHaveBeenCalledTimes(1);
        expect(Mount.fs).toHaveBeenCalledWith(fakeSession, fileSystemName, mountPoint, {});
    });
});