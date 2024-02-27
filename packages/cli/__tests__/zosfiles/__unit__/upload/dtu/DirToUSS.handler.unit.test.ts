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
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import * as fs from "fs";

describe("Upload dir-to-uss handler", () => {

    describe("process method", () => {
        let fakeSession: any = null;
        const inputDir = "/somedir/test_dir";
        const USSDir = "USS_dir";
        let handler: any;
        const UPLOAD_OPTIONS_ARG_INDEX = 3;

        // Vars populated by the mocked function
        let error: any;
        let apiMessage = "";
        let jsonObj: any;
        let logMessage = "";

        const DEFAULT_PARAMETERS = {
            arguments: {
                $0: "fake",
                _: ["fake"],
                inputDir,
                USSDir,
                // binary: boolean,
                // recursive: boolean,
                // asciiFiles: "a,b,c",
                // binaryFiles: "a,b,c",
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
        };

        beforeEach(() => {

            Upload.dirToUSSDir = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: false,
                    commandResponse: "uploaded",
                    apiResponse: [
                        {success: true, from: inputDir, to: USSDir},
                        {success: false, from: "testfrom", to: "testto"},
                        {success: undefined, from: "dummy", to: "nowhere"}
                    ]
                };
            });

            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/upload/dtu/DirToUSSDir.handler");
            handler = new handlerReq.default();
        });
        it("should upload a directory to a USS directory if requested", async () => {

            await testHandlerWorksWithDefaultParameters();
            expect(Upload.dirToUSSDir).toHaveBeenCalledTimes(1);
            expect(Upload.dirToUSSDir).toHaveBeenCalledWith(fakeSession, inputDir, USSDir, {
                binary: undefined,
                filesMap: null,
                maxConcurrentRequests: undefined,
                recursive: undefined,
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Uploading all files"
                }
            });
        });
        it("should pass attributes when a .zosattributes file is present", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const attributesContents = "foo.stuff -";
            jest.spyOn(fs, "readFileSync").mockReturnValueOnce(Buffer.from(attributesContents));

            await testHandlerWorksWithDefaultParameters();
            expect(Upload.dirToUSSDir).toHaveBeenCalledTimes(1);
            expect((Upload.dirToUSSDir as jest.Mock).mock.calls[0][UPLOAD_OPTIONS_ARG_INDEX].attributes).toBeInstanceOf(ZosFilesAttributes);
        });

        // eslint-disable-next-line jest/expect-expect
        it("should give an error if --attributes specifies a non-existent file", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
            const params = Object.assign({arguments: {attributes: undefined}}, ...[DEFAULT_PARAMETERS]);
            params.arguments.attributes = "non-existent-file";

            await testHandlerGivesExpectedErrorWithParams("Attributes file non-existent-file does not exist", params);
        });

        // eslint-disable-next-line jest/expect-expect
        it("should give an error if file specified by --attributes cannot be read", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
                throw new Error("File not found");
            });
            const params = Object.assign({arguments: {attributes: undefined}}, ...[DEFAULT_PARAMETERS]);
            params.arguments.attributes = "dodgy file";

            await testHandlerGivesExpectedErrorWithParams("Could not read attributes file dodgy file: File not found", params);
        });

        it("should override .zosattributes content with --attributes content", async () => {
            const mockAttributesFromParam = { attributes: "--attributes" };
            const mockAttributesFromLocalFile = { attributes: ".zosattributes" };
            jest.spyOn(ZosFilesAttributes, "loadFromFile").mockImplementationOnce((path?: string): any => {
                if (path === "real file") {
                    return mockAttributesFromParam;
                } else if (path?.endsWith(".zosattributes")) {
                    return mockAttributesFromLocalFile;
                }
            });

            const params = Object.assign({arguments: {attributes: undefined}}, ...[DEFAULT_PARAMETERS]);
            params.arguments.attributes = "real file";

            await testHandlerWorksWithParameters(params);

            expect(Upload.dirToUSSDir).toHaveBeenCalledTimes(1);
            expect((Upload.dirToUSSDir as jest.Mock).mock.calls[0][UPLOAD_OPTIONS_ARG_INDEX].attributes).toBe(mockAttributesFromParam);
        });

        async function testHandlerWorksWithDefaultParameters() {
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            await testHandlerWorksWithParameters(params);
        }

        async function testHandlerWorksWithParameters(params: any) {
            error = undefined;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(params);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        }


        async function testHandlerGivesExpectedErrorWithParams(errorMsg: string, params: any) {
            try {
                await handler.process(params);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.message).toBe(errorMsg);
        }
    });
});
