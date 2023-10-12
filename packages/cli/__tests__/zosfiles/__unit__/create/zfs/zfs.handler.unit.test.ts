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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(profFunc).toHaveBeenCalledWith("zosmf", false);
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
        let apiMessage = "";
        let jsonObj;
        let logMessage = "";
        let fakeSession = null;

        // Mock the zfs function
        Create.zfs = jest.fn((session) => {
            fakeSession = session;
            const impErr = new ImperativeError({
                msg: message
            });
            throw impErr;
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
                    }
                },
                profiles: {
                    get: profFunc
                }
            } as any);
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(profFunc).toHaveBeenCalledWith("zosmf", false);
        expect(Create.zfs).toHaveBeenCalledTimes(1);
        expect(Create.zfs).toHaveBeenCalledWith(fakeSession, fileSystemName, {});
    });
});
