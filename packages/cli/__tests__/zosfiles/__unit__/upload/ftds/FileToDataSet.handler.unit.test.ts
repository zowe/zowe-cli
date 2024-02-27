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
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import FileToDataSet from "../../../../../src/zosfiles/upload/ftds/FileToDataSet.handler";

describe("Upload file-to-data-set handler", () => {
    describe("process method", () => {
        let handler: FileToDataSet;
        const inputfile = "test-file";
        const dataSetName = "testing";
        beforeEach(() => {
            jest.resetAllMocks();
            handler = new FileToDataSet();
            (handler as any).checkFileExistence = jest.fn().mockResolvedValue(undefined);
        });
        it("should upload a file to a data set if requested", async () => {
            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.fileToDataset = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded",
                    apiResponse: [
                        {success: true, from: inputfile, to: dataSetName},
                        {success: false, from: "testfrom", to: "testto"},
                        {success: undefined, from: "dummy", to: "nowhere"}
                    ]
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputfile,
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
            expect(Upload.fileToDataset).toHaveBeenCalledTimes(1);
            expect(Upload.fileToDataset).toHaveBeenCalledWith(fakeSession, inputfile, dataSetName, {
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading to data set"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should upload a file to a data set in binary format if requested", async () => {
            const binary = true;

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.fileToDataset = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded",
                    apiResponse: [
                        {success: true, from: inputfile, to: dataSetName}
                    ]
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputfile,
                        dataSetName,
                        binary,
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
            expect(Upload.fileToDataset).toHaveBeenCalledTimes(1);
            expect(Upload.fileToDataset).toHaveBeenCalledWith(fakeSession, inputfile, dataSetName, {
                binary,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading to data set"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should upload a file to a data set in record format if requested", async () => {
            const record = true;

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.fileToDataset = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded",
                    apiResponse: [
                        {success: true, from: inputfile, to: dataSetName}
                    ]
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputfile,
                        dataSetName,
                        record,
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
            expect(Upload.fileToDataset).toHaveBeenCalledTimes(1);
            expect(Upload.fileToDataset).toHaveBeenCalledWith(fakeSession, inputfile, dataSetName, {
                record,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading to data set"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should display error when uploading found file to data set", async () => {
            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.fileToDataset = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: false,
                    commandResponse: "uploaded",
                    apiResponse: [
                        {success: false, from: inputfile, to: dataSetName}
                    ]
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputfile,
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
                            }),
                            error: jest.fn((logArgs) => {
                                logMessage += "\n" + logArgs;
                            })
                        },
                        progress: {
                            startBar: jest.fn(),
                            endBar: jest.fn()
                        }
                    }
                } as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe("uploaded");
            expect(Upload.fileToDataset).toHaveBeenCalledTimes(1);
            expect(Upload.fileToDataset).toHaveBeenCalledWith(fakeSession, inputfile, dataSetName, {
                binary: undefined,
                volume: undefined,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading to data set"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should not attempt to upload a file that hasn't been found", async () => {
            (handler as any).checkFileExistence = jest.fn().mockRejectedValue(new Error("File does not exist or is not accessible"));
            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";

            // Mock the submit JCL function
            Upload.fileToDataset = jest.fn();

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputfile,
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
                            }),
                            error: jest.fn((logArgs) => {
                                logMessage += "\n" + logArgs;
                            })
                        },
                        progress: {
                            startBar: jest.fn(),
                            endBar: jest.fn()
                        }
                    }
                } as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain("File does not exist or is not accessible");
            expect(Upload.fileToDataset).toHaveBeenCalledTimes(0);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
