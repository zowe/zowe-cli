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

import { Upload, ZosFilesAttributes } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

describe("Upload file-to-uss handler", () => {
    describe("process method", () => {
        it("should upload a file to a uss if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/upload/ftu/FileToUSS.handler");
            const handler = new handlerReq.default();
            const inputfile = "test-file";
            const USSFileName = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.uploadFile = jest.fn(async (session, file, name, options = {}) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded",
                    apiResponse: [
                        {success: true, from: inputfile, to: USSFileName}
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
                        USSFileName,
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
            expect(Upload.uploadFile).toHaveBeenCalledTimes(1);
            expect(Upload.uploadFile).toHaveBeenCalledWith(fakeSession, inputfile, USSFileName, {
                binary: undefined,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading USS file"
                },
                includeHidden: undefined,
                maxConcurrentRequests: undefined,
                responseTimeout: undefined
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
        it("should upload a file to a USS if requested - zosattributes file", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/upload/ftu/FileToUSS.handler");
            const handler = new handlerReq.default();
            const inputfile = "test-file";
            const USSFileName = "testing";
            let zosAttributes: any;

            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            jest.spyOn(ZosFilesAttributes, "loadFromFile").mockImplementation(() => {
                zosAttributes = Object.create(ZosFilesAttributes.prototype);
                zosAttributes.attributes = new Map([
                    ['*.json', { ignore: true }],
                    ['*.bin', { ignore: false, localEncoding: 'binary', remoteEncoding: 'binary' }],
                    ['*.jcl', { ignore: false, localEncoding: 'IBM-1047', remoteEncoding: 'IBM-1047' }],
                    ['*.md', { ignore: false, localEncoding: 'UTF-8', remoteEncoding: 'UTF-8' }],
                    ['*.txt', { ignore: false, localEncoding: 'UTF-8', remoteEncoding: 'IBM-1047' }]
                ]);
                zosAttributes.basePath = undefined;
                return zosAttributes;
            });
            Upload.uploadFile = jest.fn(async (session, file, name, options = {}) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded",
                    apiResponse: [
                        { success: true, from: inputfile, to: USSFileName }
                    ]
                };
            });
            try {
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputfile,
                        USSFileName,
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
                            startBar: jest.fn(() => {
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
            expect(Upload.uploadFile).toHaveBeenCalledTimes(1);
            expect(Upload.uploadFile).toHaveBeenCalledWith(fakeSession, inputfile, USSFileName, {
                attributes: zosAttributes,
                binary: undefined,
                includeHidden: undefined,
                maxConcurrentRequests: undefined,
                responseTimeout: undefined,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading USS file"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
        it("should upload a file to a USS if requested - zosattributes file - binary", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/upload/ftu/FileToUSS.handler");
            const handler = new handlerReq.default();
            const inputfile = "test-file";
            const USSFileName = "testing";
            let zosAttributes: any;

            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            jest.spyOn(ZosFilesAttributes, "loadFromFile").mockImplementation(() => {
                zosAttributes = Object.create(ZosFilesAttributes.prototype);
                zosAttributes.attributes = new Map([
                    ['*.json', { ignore: true }],
                    ['*.bin', { ignore: false, localEncoding: 'binary', remoteEncoding: 'binary' }],
                    ['*.jcl', { ignore: false, localEncoding: 'IBM-1047', remoteEncoding: 'IBM-1047' }],
                    ['*.md', { ignore: false, localEncoding: 'UTF-8', remoteEncoding: 'UTF-8' }],
                    ['*.txt', { ignore: false, localEncoding: 'binary', remoteEncoding: 'binary' }]
                ]);
                zosAttributes.basePath = undefined;
                return zosAttributes;
            });
            Upload.uploadFile = jest.fn(async (session, file, name, options = {}) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded",
                    apiResponse: [
                        { success: true, from: inputfile, to: USSFileName }
                    ]
                };
            });
            try {
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputfile,
                        USSFileName,
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
                            startBar: jest.fn(() => {
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
            expect(Upload.uploadFile).toHaveBeenCalledTimes(1);
            expect(Upload.uploadFile).toHaveBeenCalledWith(fakeSession, inputfile, USSFileName, {
                attributes: zosAttributes,
                binary: undefined,
                includeHidden: undefined,
                maxConcurrentRequests: undefined,
                responseTimeout: undefined,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading USS file"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
