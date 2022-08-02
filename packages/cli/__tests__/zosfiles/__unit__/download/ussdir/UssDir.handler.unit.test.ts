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

import { Download, IDownloadOptions, IUSSListOptions } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

/* eslint-disable noImplicitAny */
const defaultListObj: IUSSListOptions = {
    name: "*",
    depth: undefined,
    filesys: undefined,
    group: undefined,
    maxLength: undefined,
    mtime: undefined,
    perm: undefined,
    size: undefined,
    symlinks: undefined,
    type: undefined,
    user: undefined
};
const defaultDownloadObj: IDownloadOptions = {
    task: {
        percentComplete: 0,
        stageName: 0,
        statusMessage: "Searching for files"
    }
};
/* eslint-enable noImplicitAny */

describe("Download uss dir handler", () => {
    describe("process method", () => {
        it("should download a uss dir if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
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
                        ussDirName,
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
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, defaultDownloadObj, defaultListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
