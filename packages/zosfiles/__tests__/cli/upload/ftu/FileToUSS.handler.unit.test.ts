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

describe("Upload file-to-uss handler", () => {
    describe("process method", () => {
        it("should upload a file to a uss if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/upload/ftu/FileToUSS.handler");
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
            Upload.fileToUSSFile = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded",
                    apiResponse: [
                        { success: true, from: inputfile, to: USSFileName }
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
            expect(Upload.fileToUSSFile).toHaveBeenCalledTimes(1);
            expect(Upload.fileToUSSFile).toHaveBeenCalledWith(fakeSession, inputfile, USSFileName);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

    });
});
