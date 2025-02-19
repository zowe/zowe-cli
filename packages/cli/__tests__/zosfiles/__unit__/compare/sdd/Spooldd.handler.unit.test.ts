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

import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { DiffUtils, IDiffOptions, ImperativeError } from "@zowe/imperative";

describe("Compare spooldd handler", () => {
    describe("process method", () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/compare/sdd/Spooldd.handler");
        const handler = new handlerReq.default();
        const spoolDescription1 = "jobName1:jobId1:2";
        const spoolDescription2 = "jobName2:jobId2:3";
        // Vars populated by the mocked function
        let error: undefined | ImperativeError | Error;
        let apiMessage = "";
        let jsonObj: object;
        let logMessage = "";
        let fakeSession: object;

        const spoolDescArr1 = spoolDescription1.split(":");
        const jobName1: string = spoolDescArr1[0];
        const jobId1: string = spoolDescArr1[1];
        const spoolId1: number = Number(spoolDescArr1[2]);

        // Mocks
        const getSpoolContentByIdSpy = jest.spyOn(GetJobs, "getSpoolContentById");
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
                spoolDescription1,
                spoolDescription2,
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

        beforeEach(()=> {
            // mock reading from spool (string1 and string2)
            getSpoolContentByIdSpy.mockReset();
            getSpoolContentByIdSpy.mockImplementation(jest.fn(async (session) => {
                fakeSession = session;
                return "compared";
            }));
            // mock diff
            getDiffStringSpy.mockReset();
            getDiffStringSpy.mockImplementation(jest.fn(async () => {
                return "compared string";
            }));
            logMessage = "";
            error = undefined;
        });

        it("should compare two spooldd in terminal", async () => {
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArguments as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(getSpoolContentByIdSpy).toHaveBeenCalledTimes(2);
            expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(getSpoolContentByIdSpy).toHaveBeenCalledWith(fakeSession as any, jobName1, jobId1, spoolId1);
            expect(jsonObj).toMatchObject({commandResponse: "compared string", success: true});
            expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared", options);
        });

        it("should compare two spooldd in terminal with --context-lines option", async () => {
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
            expect(getSpoolContentByIdSpy).toHaveBeenCalledTimes(2);
            expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(getSpoolContentByIdSpy).toHaveBeenCalledWith(fakeSession as any, jobName1, jobId1, spoolId1);
            expect(jsonObj).toMatchObject({commandResponse: "compared string", success: true});
            expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared",  {...options, contextLinesArg: contextLinesArg});
        });

        it("should compare two spooldd in terminal with --seqnum specified", async () => {
            const processArgCopy: any = {
                ...processArguments,
                arguments:{
                    ...processArguments.arguments,
                    seqnum: false,
                }
            };

            //overwrite spool(strings 1 & 2) to include seqnums to chop off in LocalFileDatasetHandler
            getSpoolContentByIdSpy.mockImplementation(jest.fn(async (session) => {
                fakeSession = session;
                return "compared12345678";
            }));

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArgCopy as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(getSpoolContentByIdSpy).toHaveBeenCalledTimes(2);
            expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(getSpoolContentByIdSpy).toHaveBeenCalledWith(fakeSession as any, jobName1, jobId1, spoolId1);
            expect(jsonObj).toMatchObject({commandResponse: "compared string", success: true});
            expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared", options);
        });

        it("should compare two spooldd in browser", async () => {
            openDiffInbrowserSpy.mockImplementation(jest.fn());
            processArguments.arguments.browserView = true;

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
