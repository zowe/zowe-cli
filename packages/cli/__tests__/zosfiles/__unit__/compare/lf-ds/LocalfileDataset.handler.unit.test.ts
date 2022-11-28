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

import { Get } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { DiffUtils } from "@zowe/imperative";

describe("Compare local-file and data-set handler", () => {
    describe("process method", () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/compare/lf-ds/LocalfileDataset.handler");
        const handler = new handlerReq.default();
        const localFilePath = "packages/cli/__tests__/zosfiles/__unit__/compare/lf-ds/LocalfileDataset.definition.unit.test.ts";
        const dataSetName = "testing2";
        // Vars populated by the mocked function
        let error;
        let apiMessage = "";
        let jsonObj:object;
        let logMessage = "";
        let fakeSession: object;

        // Mock the compare ds function
        Get.dataSet = jest.fn(async (session) => {
            fakeSession = session;
            return Buffer.from("compared");
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

        const processArguments = {
            arguments: {
                $0: "fake",
                _: ["fake"],
                localFilePath,
                dataSetName,
                browserView: false,
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
                        logMessage += logArgs;
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
        };


        it("should compare local-file and data-set in terminal", async () => {

            DiffUtils.getDiffString = jest.fn(async () => {
                return "compared string";
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArguments as any);
            } catch (e) {
                error = e;
            }

            expect(Get.dataSet).toHaveBeenCalledTimes(1);
            expect(Get.dataSet).toHaveBeenCalledWith(fakeSession as any, dataSetName, {
                task: {
                    percentComplete: 0,
                    stageName: 0,
                    statusMessage: "Retrieving content for the second file/dataset"
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(DiffUtils.getDiffString).toHaveBeenCalledTimes(1);
        });

        it("should compare local-file and data-set in browser", async () => {
            jest.spyOn(DiffUtils, "openDiffInbrowser").mockImplementation(jest.fn());

            processArguments.arguments.browserView = true ;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArguments as any);
            } catch (e) {
                error = e;
            }

            expect(DiffUtils.openDiffInbrowser).toHaveBeenCalledTimes(1);
        });
    });
});
