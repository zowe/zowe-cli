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

import { Upload } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

describe("Upload stdin-to-data-set handler", () => {
    describe("process method", () => {
        it("should upload a file to a data set if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/upload/stds/StdinToDataSet.handler");
            const handler = new handlerReq.default();
            const inputBuffer = Buffer.from("test-data");
            const dataSetName = "testing";

            // Vars populated by the mocked function
            let error;

            // Mock the submit JCL function
            Upload.streamToDataSet = jest.fn(async (_session) => {
                return {
                    success: true,
                    commandResponse: "uploaded"
                };
            });

            process.nextTick(() => {
                process.stdin.emit("data", Buffer.from("test-data"));
                process.stdin.emit("end");
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputBuffer,
                        dataSetName,
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
            expect(Upload.streamToDataSet).toHaveBeenCalledTimes(1);
        });

        it("should upload a file to a data set in binary format if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/upload/stds/StdinToDataSet.handler");
            const handler = new handlerReq.default();
            const inputBuffer = Buffer.from("test-data");
            const dataSetName = "testing";
            const binary = true;

            // Vars populated by the mocked function
            let error;
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.streamToDataSet = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded"
                };
            });

            process.nextTick(() => {
                process.stdin.emit("data", Buffer.from("test-data"));
                process.stdin.emit("end");
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputBuffer,
                        dataSetName,
                        binary,
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
            expect(Upload.streamToDataSet).toHaveBeenCalledWith(fakeSession, undefined, dataSetName, {
                binary,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading stdin to data set"
                }
            });
            expect(Upload.streamToDataSet).toHaveBeenCalledTimes(1);
        });

        it("should upload a file to a data set in record format if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/upload/stds/StdinToDataSet.handler");
            const handler = new handlerReq.default();
            const inputBuffer = Buffer.from("test-data");
            const dataSetName = "testing";
            const record = true;

            // Vars populated by the mocked function
            let error;
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.streamToDataSet = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded"
                };
            });

            process.nextTick(() => {
                process.stdin.emit("data", Buffer.from("test-data"));
                process.stdin.emit("end");
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputBuffer,
                        dataSetName,
                        record,
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
            expect(Upload.streamToDataSet).toHaveBeenCalledWith(fakeSession, undefined, dataSetName, {
                record,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading stdin to data set"
                }
            });
            expect(Upload.streamToDataSet).toHaveBeenCalledTimes(1);
        });
    });
});
