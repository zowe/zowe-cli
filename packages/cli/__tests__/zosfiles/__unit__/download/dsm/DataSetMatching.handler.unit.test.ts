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

import { Download, IDownloadOptions } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

const fakeDownloadOptions: IDownloadOptions = {
    binary: undefined,
    directory: undefined,
    encoding: undefined,
    excludePatterns: undefined,
    extension: undefined,
    extensionMap: null,
    failFast: undefined,
    maxConcurrentRequests: undefined,
    preserveOriginalLetterCase: undefined,
    record: undefined,
    responseTimeout: undefined,
    volume: undefined
};

describe("Download DataSetMatching handler", () => {
    describe("process method", () => {
        it("should download matching datasets if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/dsm/DataSetMatching.handler");
            const handler = new handlerReq.default();
            const pattern = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Download.dataSetsMatchingPattern = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        pattern,
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
            expect(Download.dataSetsMatchingPattern).toHaveBeenCalledTimes(1);
            expect(Download.dataSetsMatchingPattern).toHaveBeenCalledWith(fakeSession, [pattern], {
                ...fakeDownloadOptions,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Downloading data sets matching a pattern"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should handle generation of an extension map", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/dsm/DataSetMatching.handler");
            const handler = new handlerReq.default();
            const pattern = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;
            const extensionMap = "CNTL=JCL,PARMLIB=JCL,LOADLIB=JCL";

            // Mock the submit JCL function
            Download.dataSetsMatchingPattern = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        pattern,
                        extensionMap,
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
            expect(Download.dataSetsMatchingPattern).toHaveBeenCalledTimes(1);
            expect(Download.dataSetsMatchingPattern).toHaveBeenCalledWith(fakeSession, [pattern], {
                ...fakeDownloadOptions,
                extensionMap: {cntl: "jcl", parmlib: "jcl", loadlib: "jcl"},
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Downloading data sets matching a pattern"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should gracefully handle an extension map parsing error", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/dsm/DataSetMatching.handler");
            const handler = new handlerReq.default();
            const pattern = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;
            const extensionMap = "CNTL=JCL,PARMLIB-JCL,LOADLIB=JCL";

            // Mock the submit JCL function
            Download.dataSetsMatchingPattern = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        pattern,
                        extensionMap,
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

            expect(error).toBeDefined();
            expect(error.message).toContain("An error occurred processing the extension map");
            expect(Download.dataSetsMatchingPattern).toHaveBeenCalledTimes(0);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should handle generation of an exclusion list", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/dsm/DataSetMatching.handler");
            const handler = new handlerReq.default();
            const pattern = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;
            const excludePatterns = "TEST.EXCLUDE.**.CNTL";

            // Mock the submit JCL function
            Download.dataSetsMatchingPattern = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        pattern,
                        excludePatterns,
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
            expect(Download.dataSetsMatchingPattern).toHaveBeenCalledTimes(1);
            expect(Download.dataSetsMatchingPattern).toHaveBeenCalledWith(fakeSession, [pattern], {
                ...fakeDownloadOptions,
                excludePatterns: ["TEST.EXCLUDE.**.CNTL"],
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Downloading data sets matching a pattern"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
