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

import { Upload } from "../../../../src/api/methods/upload";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import * as path from "path";

describe("Upload dir-to-uss handler", () => {
    describe("process method", () => {
        it("should upload a directory to a USS directory if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/upload/dtu/DirToUSSDir.handler");
            const handler = new handlerReq.default();
            let inputDir = "test_dir";
            inputDir = path.resolve(inputDir);
            const USSDir = "USS_dir";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.dirToUSSDir = jest.fn((session) => {
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

            // Mocked function references
            const profFunc = jest.fn((args) => {
                return {
                    host: "fake",
                    port: "fake",
                    user: "fake",
                    password: "fake",
                    auth: "fake",
                    rejectUnauthorized: "fake",
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
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
            expect(Upload.dirToUSSDir).toHaveBeenCalledTimes(1);
            expect(Upload.dirToUSSDir).toHaveBeenCalledWith(fakeSession, inputDir, USSDir, undefined, undefined, null);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
