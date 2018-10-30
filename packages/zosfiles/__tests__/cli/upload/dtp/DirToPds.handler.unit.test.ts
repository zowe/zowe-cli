/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { Upload } from "../../../../src/api/methods/upload";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

describe("Upload dir-to-pds handler", () => {
    describe("process method", () => {
        it("should upload a directory to a PDS if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/upload/dtp/DirToPds.handler");
            const handler = new handlerReq.default();
            const inputdir = "test-dir";
            const dataSetName = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.dirToPds = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: false,
                    commandResponse: "uploaded",
                    apiResponse: [
                        {success: true, from: inputdir, to: dataSetName},
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
                    pass: "fake",
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
                        inputdir,
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
            expect(Upload.dirToPds).toHaveBeenCalledTimes(1);
            expect(Upload.dirToPds).toHaveBeenCalledWith(fakeSession, inputdir, dataSetName, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
