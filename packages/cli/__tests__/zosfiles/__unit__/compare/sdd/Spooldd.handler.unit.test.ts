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
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { DiffUtils, IDiffOptions } from "@zowe/imperative";
import { readFileSync } from "fs";

describe("Compare spooldd handler", () => {
    describe("process method", () => {
        // Require the handler and create a new instance
        const handlerReq = require("../../../../../src/zosfiles/compare/sdd/Spooldd.handler");
        const handler = new handlerReq.default();
        const spoolDescription1 = "jobName1:jobId1:2";
        const spoolDescription2 = "jobName2:jobId2:3";
        // Vars populated by the mocked function
        let error;
        let apiMessage = "";
        let jsonObj: object;
        let logMessage = "";
        let fakeSession: object;

        const spoolDescArr1 = spoolDescription1.split(":");
        const jobName1: string = spoolDescArr1[0];
        const jobId1: string = spoolDescArr1[1];
        const spoolId1: number = Number(spoolDescArr1[2]);

        const spoolDescArr2 = spoolDescription2.split(":");
        const jobName2: string = spoolDescArr2[0];
        const jobId2: string = spoolDescArr2[1];
        const spoolId2: number = Number(spoolDescArr2[2]);

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
        beforeEach(()=> {
            // Mock the get uss function
            GetJobs.getSpoolContentById = jest.fn(async (session) => {
                fakeSession = session;
                return "compared";
            });
            logMessage = "";
        });

        it("should compare two spooldd in terminal", async () => {

            DiffUtils.getDiffString = jest.fn(async () => {
                return "compared string";

            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArguments as any);
            } catch (e) {
                error = e;
            }

            expect(GetJobs.getSpoolContentById).toHaveBeenCalledTimes(2);
            expect(GetJobs.getSpoolContentById).toHaveBeenCalledWith(fakeSession as any, jobName1, jobId1, spoolId1);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(DiffUtils.getDiffString).toHaveBeenCalledTimes(1);
        });

        it("should compare two spooldd in terminal with --context-lines option", async () => {
            let contextLinesArg: number = 2;
            let processArgCopy: any = {
                ...processArguments,
                arguments:{
                    ...processArguments.arguments,
                    contextLines: contextLinesArg
                }
            };
            let options: IDiffOptions = {
                contextLinesArg, 
                outputFormat: "terminal"
            };

            DiffUtils.getDiffString = jest.fn(async () => {
                return "compared string";

            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(processArgCopy as any);
            } catch (e) {
                error = e;
            }

            expect(GetJobs.getSpoolContentById).toHaveBeenCalledTimes(2);
            expect(GetJobs.getSpoolContentById).toHaveBeenCalledWith(fakeSession as any, jobName1, jobId1, spoolId1);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toEqual("");
            expect(logMessage).toEqual("compared string");
            expect(DiffUtils.getDiffString).toHaveBeenCalledTimes(1);
            expect(DiffUtils.getDiffString).toHaveBeenCalledWith("compared", "compared", options)
        });
        
        it("should compare two spooldd in browser", async () => {
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
