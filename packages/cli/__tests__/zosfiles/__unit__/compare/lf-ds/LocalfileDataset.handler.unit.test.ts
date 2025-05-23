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

jest.mock("fs");

import { Get } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { DiffUtils, IDiffOptions, ImperativeError } from "@zowe/imperative";
import * as fs from "fs";
describe("Compare local-file and data-set handler", () => {
    describe("process method", () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/compare/lf-ds/LocalfileDataset.handler");
        const handler = new handlerReq.default();
        const dataSetName = "testing";
        // Vars populated by the mocked function
        let error: undefined | ImperativeError | Error;
        let apiMessage = "";
        let jsonObj:object;
        let logMessage = "";
        let fakeSession: object;
        // Mocks
        const fstatSyncSpy = jest.spyOn(fs, "fstatSync");
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync");
        const getDataSetSpy = jest.spyOn(Get, "dataSet");
        const getDiffStringSpy = jest.spyOn(DiffUtils, "getDiffString");
        const openDiffInbrowserSpy = jest.spyOn(DiffUtils, "openDiffInbrowser");
        const profFunc = jest.fn((_args) => {
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
                localFilePath: "",
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
                    startBar: jest.fn((_parms) => {
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
        const options: IDiffOptions = {
            outputFormat: "terminal"
        };
        const dsTask = {
            percentComplete: 0,
            stageName: 0,
            statusMessage: "Retrieving content for the second file/dataset"
        };

        beforeEach(()=> {
            // mock reading from local file (string 1)
            fstatSyncSpy.mockReset();
            fstatSyncSpy.mockImplementation(jest.fn(() => {
                return {isFile: () => true} as any;
            }));
            readFileSyncSpy.mockReset();
            readFileSyncSpy.mockImplementation(jest.fn(() => {
                return "compared";
            }));
            // mock reading from data set (string 2)
            getDataSetSpy.mockReset();
            getDataSetSpy.mockImplementation(jest.fn(async (session) => {
                fakeSession = session;
                return Buffer.from("compared string");
            }));
            // mock diff
            getDiffStringSpy.mockReset();
            getDiffStringSpy.mockImplementation(jest.fn(() => {
                return Promise.resolve("compared string");
            }));
            logMessage = "";
            error = undefined;
        });

        it("should compare local-file and data-set in terminal", async () => {
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArguments as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
            expect(getDataSetSpy).toHaveBeenCalledTimes(1);
            expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(getDataSetSpy).toHaveBeenCalledWith(fakeSession as any, dataSetName, { task: dsTask });
            expect(jsonObj).toMatchObject({commandResponse: "compared string", success: true});
            expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared string", options);
        });

        it("should compare local-file and data-set in terminal with --context-lines option", async () => {
            const contextLinesArg: number = 2;
            const processArgCopy: any = {
                ...processArguments,
                arguments:{
                    ...processArguments.arguments,
                    contextLines: contextLinesArg
                }
            };

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArgCopy as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
            expect(getDataSetSpy).toHaveBeenCalledTimes(1);
            expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(getDataSetSpy).toHaveBeenCalledWith(fakeSession as any, dataSetName, { task: dsTask });
            expect(jsonObj).toMatchObject({commandResponse: "compared string", success: true});
            expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared string",  {...options, contextLinesArg: contextLinesArg});
        });

        it("should compare local-file and data-set in terminal with --seqnum specified", async () => {
            const processArgCopy: any = {
                ...processArguments,
                arguments:{
                    ...processArguments.arguments,
                    seqnum: false,
                }
            };

            //overwrite lf(string1) to include seqnums to chop off in LocalFileDatasetHandler
            readFileSyncSpy.mockImplementation(jest.fn(() => {
                return "compared12345678";
            }));
            //overwrite ds(string2) to include seqnums to chop off in LocalFileDatasetHandler
            getDataSetSpy.mockImplementation(jest.fn(async (session) => {
                fakeSession = session;
                return Buffer.from("compared string12345678");
            }));

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArgCopy as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
            expect(getDataSetSpy).toHaveBeenCalledTimes(1);
            expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(getDataSetSpy).toHaveBeenCalledWith(fakeSession as any, dataSetName, { task: dsTask });
            expect(jsonObj).toMatchObject({commandResponse: "compared string", success: true});
            expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared string", options);
        });

        it("should compare local-file and data-set in browser", async () => {
            openDiffInbrowserSpy.mockImplementation(jest.fn());
            processArguments.arguments.browserView = true ;

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArguments as any);
            } catch (e) {
                error = e;
            }

            expect(openDiffInbrowserSpy).toHaveBeenCalledTimes(1);
        });
    });
});
