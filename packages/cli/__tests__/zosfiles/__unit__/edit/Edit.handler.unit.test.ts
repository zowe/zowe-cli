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

import { Get, Upload } from "@zowe/zos-files-for-zowe-sdk";
import { GuiResult } from "@zowe/imperative";
import {ILocalFile,
EditUtilities} from "../../../../src/zosfiles/edit/Edit.utils"

describe("Files Edit Group Handler", () => {
    describe("process method", () => {
        // Require the handler and create a new instance
        const handlerDsReq = require("../../../../../src/zosfiles/edit/ds/Dataset.handler");
        const handlerUssReq = require("../../../../../src/zosfiles/edit/ds/Dataset.handler");
        const handlerDs = new handlerDsReq.default();
        const handlerUss = new handlerUssReq.default();
        const dataSetName = "testingDataset";
        const ussFileName = "testingUssFile";

        //create lfFile objects
        let dslf: ILocalFile = {
            tempPath: null,
            fileName: dataSetName,
            fileType: "ds",
            guiAvail: true,
            zosResp: null
        };

        let usslf: ILocalFile = {
            tempPath: null,
            fileName: ussFileName,
            fileType: "uss",
            guiAvail: true,
            zosResp: null
        };

        // Vars populated by the mocked function
        let error;
        let apiMessage = "";
        let jsonObj: object;
        let logMessage = "";
        let fakeSession: object;
        const zosErrorResp_etagMismatch = {
            apiResponse:[],
            success: false,
            commandResponse: 'z/OSMF REST API Error:\nRest API failure with HTTP(S) status 412\n',
        }

        // Mocks
        // const getDataSetSpy = jest.spyOn(Get, "dataSet");
        // const getDiffStringSpy = jest.spyOn(DiffUtils, "getDiffString");
        // const openDiffInbrowserSpy = jest.spyOn(DiffUtils, "openDiffInbrowser");
        const checkForStash = jest.spyOn(EditUtilities, "checkForStash");
        const localDownload = jest.spyOn(EditUtilities, "localDownload");
        const promptResp = jest.spyOn(EditUtilities, "promptUser");
        const uploadUssFile = jest.spyOn(Upload, "fileToUssFile");
        const uploadDsFile = jest.spyOn(Upload, "fileToDataset");
        // const profFunc = jest.fn((args) => {
        //     return {
        //         host: "fake",
        //         port: "fake",
        //         user: "fake",
        //         password: "fake",
        //         auth: "fake",
        //         rejectUnauthorized: "fake",
        //     };
        // });
        // const processArguments = {
        //     arguments: {
        //         $0: "fake",
        //         _: ["fake"],
        //         dataSetName1,
        //         dataSetName2,
        //         browserView: false,
        //         ...UNIT_TEST_ZOSMF_PROF_OPTS
        //     },
        //     response: {
        //         data: {
        //             setMessage: jest.fn((setMsgArgs) => {
        //                 apiMessage = setMsgArgs;
        //             }),
        //             setObj: jest.fn((setObjArgs) => {
        //                 jsonObj = setObjArgs;
        //             })
        //         },
        //         console: {
        //             log: jest.fn((logArgs) => {
        //                 logMessage += logArgs;
        //             })
        //         },
        //         progress: {
        //             startBar: jest.fn((parms) => {
        //                 // do nothing
        //             }),
        //             endBar: jest.fn(() => {
        //                 // do nothing
        //             })
        //         }
        //     },
        //     profiles: {
        //         get: profFunc
        //     }
        // };
        // const options: IDiffOptions = {
        //     outputFormat: "terminal"
        // };
        // const dsTask = {
        //     percentComplete: 0,
        //     stageName: 0,
        //     statusMessage: "Retrieving content for the second file/dataset"
        // };

        // beforeEach(() => {
        //     // mock reading from data set (string1 and string2)
        //     getDataSetSpy.mockReset();
        //     getDataSetSpy.mockImplementation(jest.fn(async (session) => {
        //         fakeSession = session;
        //         return Buffer.from("compared");
        //     }));
        //     // mock diff
        //     getDiffStringSpy.mockReset();
        //     getDiffStringSpy.mockImplementation(jest.fn(async () => {
        //         return "compared string";
        //     }));
        //     logMessage = "";
        // });

        // it("should compare two data sets in terminal", async () => {
        //     try {
        //         // Invoke the handler with a full set of mocked arguments and response functions
        //         await handler.process(processArguments as any);
        //     } catch (e) {
        //         error = e;
        //     }

        //     expect(getDataSetSpy).toHaveBeenCalledTimes(2);
        //     expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
        //     expect(apiMessage).toEqual("");
        //     expect(logMessage).toEqual("compared string");
        //     expect(getDataSetSpy).toHaveBeenCalledWith(fakeSession as any, dataSetName1, { task: dsTask });
        //     expect(jsonObj).toMatchObject({commandResponse: "compared string", success: true});
        //     expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared", options);
        // });

        // it("should compare two data sets in terminal with --context-lines option", async () => {
        //     const contextLinesArg: number = 2;
        //     const processArgCopy: any = {
        //         ...processArguments,
        //         arguments:{
        //             ...processArguments.arguments,
        //             contextLines: contextLinesArg
        //         }
        //     };

        //     try {
        //         // Invoke the handler with a full set of mocked arguments and response functions
        //         await handler.process(processArgCopy);
        //     } catch (e) {
        //         error = e;
        //     }

        //     expect(getDataSetSpy).toHaveBeenCalledTimes(2);
        //     expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
        //     expect(apiMessage).toEqual("");
        //     expect(logMessage).toEqual("compared string");
        //     expect(getDataSetSpy).toHaveBeenCalledWith(fakeSession as any, dataSetName1, { task: dsTask });
        //     expect(jsonObj).toMatchObject({commandResponse: "compared string", success: true});
        //     expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared",  {...options, contextLinesArg: contextLinesArg});
        // });

        // it("should compare two data sets in terminal with --seqnum specified", async () => {
        //     const processArgCopy: any = {
        //         ...processArguments,
        //         arguments:{
        //             ...processArguments.arguments,
        //             seqnum: false,
        //         }
        //     };

        //     //overwrite ds(strings 1 & 2) to include seqnums to chop off in LocalFileDatasetHandler
        //     getDataSetSpy.mockImplementation(jest.fn(async (session) => {
        //         fakeSession = session;
        //         return Buffer.from("compared12345678");
        //     }));

        //     try {
        //         // Invoke the handler with a full set of mocked arguments and response functions
        //         await handler.process(processArgCopy);
        //     } catch (e) {
        //         error = e;
        //     }

        //     expect(getDataSetSpy).toHaveBeenCalledTimes(2);
        //     expect(getDiffStringSpy).toHaveBeenCalledTimes(1);
        //     expect(apiMessage).toEqual("");
        //     expect(logMessage).toEqual("compared string");
        //     expect(getDataSetSpy).toHaveBeenCalledWith(fakeSession as any, dataSetName1, { task: dsTask });
        //     expect(jsonObj).toMatchObject({commandResponse: "compared string", success: true});
        //     expect(getDiffStringSpy).toHaveBeenCalledWith("compared", "compared", options);
        // });

        // it("should compare two data sets in browser", async () => {
        //     openDiffInbrowserSpy.mockImplementation(jest.fn());
        //     processArguments.arguments.browserView = true ;

        //     try {
        //         // Invoke the handler with a full set of mocked arguments and response functions
        //         await handler.process(processArguments as any);
        //     } catch (e) {
        //         error = e;
        //     }

        //     expect(openDiffInbrowserSpy).toHaveBeenCalledTimes(1);
        // });

        describe("Success scenarios", () => {
            describe("successful situations regardless of file type", () => {
                it("should accurately detect the presence of a stash"), () => {}
                it("should accurately detect environment state (headless or gui avail)"), () => {}
                it("should be able to do a terminal file compare if in headless environment"), () => {}
                it("should be able to do a gui file compare if gui avail"), () => {}
                it("should successfully upload when etags are matching"), () => {}
                it("should open local file in correct editor"), () => {}
                it("should be able to successfully detect changes in remote (changed etag)"), () => {}
                it("should truly destroy temp file once edits are successfully uploaded to remote"), () => {}
                it("should refresh etag without overwriting stashed file when this situation is requested"), () => {
                    //SETUP lfFile to have different etag than returned zos response for remote file

                    //TRIGGER a failed upload (because remote changed)

                    //TEST that etag is refreshed without overwriting lf
                }
            });
            describe("edit uss successfully", () => {
                it("should be able to build the correct temp path - uss"), () => {

                }
                it("should be able to create an accurate lfFile object - uss"), () => {

                }
                it("should use appropriate download method - uss"), () => {}
            })
            describe("edit ds successfully", () => {
                it("should be able to build the correct temp path - ds"), () => {}
                it("should be able to create an accurate lfFile object - ds"), () => {}
                it("should use appropriate download method - ds"), () => {}
            })
        });
        describe("Expected failures", () => {
            it("should terminate command if file is not found on mainframe"), () => {}
            it("shouldn't successfully upload if two different etags (lf and remote etags are mismatched"), () => {}
            it("should quit & stash if user doesn't answer a Y/n prompt within timeout period"), () => {}
        });
    });
});

