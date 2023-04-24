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

// import { Upload } from "@zowe/zos-files-for-zowe-sdk";
// import * as fs from "fs";
// import {ILocalFile,
// EditUtilities} from "../../../../src/zosfiles/edit/Edit.utils"

describe("Files Edit Group Handler", () => {
    // Require the handler and create a new instance
    // const handlerDsReq = require("../../../../../src/zosfiles/edit/ds/Dataset.handler");
    // const handlerUssReq = require("../../../../../src/zosfiles/edit/ds/Dataset.handler");
    // const handlerDs = new handlerDsReq.default();
    // const handlerUss = new handlerUssReq.default();
    // const dataSetName = "testingDataset";
    // const ussFileName = "testingUssFile";

    // //create lfFile objects
    // let dslf: ILocalFile = {
    //     tempPath: null,
    //     fileName: dataSetName,
    //     fileType: 'ds',
    //     guiAvail: true,
    //     zosResp: null
    // };
    // let usslf: ILocalFile = {
    //     tempPath: null,
    //     fileName: ussFileName,
    //     fileType: 'uss',
    //     guiAvail: true,
    //     zosResp: null
    // };

    // Vars populated by the mocked function
    // let error;
    // let apiMessage = "";
    // let jsonObj: object;
    // let logMessage = "";
    // let fakeSession: object;
    // const mfZosRespSuccess = {};
    // const zosErrorResp_etagMismatch = {
    //     apiResponse:[],
    //     success: false,
    //     commandResponse: 'z/OSMF REST API Error:\nRest API failure with HTTP(S) status 412\n',
    // }

    // Mocks
    // const getDataSetSpy = jest.spyOn(Get, "dataSet");
    // const getDiffStringSpy = jest.spyOn(DiffUtils, "getDiffString");
    // const openDiffInbrowserSpy = jest.spyOn(DiffUtils, "openDiffInbrowser");
    // const existsSyncSpy = jest.spyOn(fs, "existsSync");
    // const localDownloadSpy = jest.spyOn(EditUtilities, "localDownload");
    // const promptRespSpy = jest.spyOn(EditUtilities, "promptUser");
    // const uploadUssFileSpy = jest.spyOn(Upload, "fileToUssFile");
    // const uploadDsFileSpy = jest.spyOn(Upload, "fileToDataset");
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

    describe("buildTempPath()", () => {
        it("should be able to build the correct temp path - uss"), () => {
        //TEST SETUP
        // pass in uss lfFile (file name with underscores) to buildTempPath()
        //TEST CONFIRMATION
        // check that the returned string (string.split('.')[0]) contains only numbers and letters
        }
        it("should be able to build the correct temp path - ds"), () => {
        //buildTempPath() check that the returned string contains lfFile.fileName + ext
        }
    })
    describe("checkForStash()", () => {
        it("should detect the presence of a stash"), () => {
            //TEST SETUP
            // existsSync(tempPath) returns true
            //TEST CONFIRMATION
            // that existsSync(tempPath) returns true
        }
        it("should catch an error when searching for stash"), () => {
            //TEST SETUP
            // existsSync(tempPath) throws err
            //TEST CONFIRMATION
            // that existsSync(tempPath) returns thrown err
        }
    })
    describe("promptUser()", () => {
        describe("promptUser() successes", () => {
            it("for case `Prompt.useStash` should detect the presence of a stash"), () => {
            //TEST SETUP
            // CliUtils.readPrompt returns 'y'
            //TEST CONFIRMATION
            // promptUser returns true
            }
            it("for case `Prompt.doneEditing` should detect user is done editing"), () => {
            //TEST SETUP
            // CliUtils.readPrompt returns 'done'
            //TEST CONFIRMATION
            // promptUser returns true
            }
            it("for case `Prompt.continueToUpload` should upload despite changes on remote"), () => {
            //TEST SETUP
            // CliUtils.readPrompt returns 'y'
            //TEST CONFIRMATION
            // promptUser returns true
            }
            it("for case `Prompt.viewUpdatedRemote` should view updated remote"), () => {
            //TEST SETUP
            // CliUtils.readPrompt returns 'y'
            //TEST CONFIRMATION
            // promptUser returns true
            }
        })
        describe("promptUser() failures", () => {
            it("for case `Prompt.useStash` should detect no input"), () => {
            //TEST SETUP
            // CliUtils.readPrompt returns null
            //TEST CONFIRMATION
            // check that imperative error is thrown
            }
            it("for case `Prompt.doneEditing` should detect no input"), () => {
            //TEST SETUP
            // CliUtils.readPrompt returns null
            //TEST CONFIRMATION
            // check that imperative error is thrown
            }
            it("for case `Prompt.continueToUpload` should detect no input"), () => {
            //TEST SETUP
            // CliUtils.readPrompt returns null
            //TEST CONFIRMATION
            // check that imperative error is thrown
            }
            it("for case `Prompt.viewUpdatedRemote` should detect no input"), () => {
            //TEST SETUP
            // CliUtils.readPrompt returns null
            //TEST CONFIRMATION
            // check that imperative error is thrown
            }
        })
    })
    describe("localDownload()", () => {
        it("should apply etag from remote to ILocalFile without overwriting stash"), () => {
            //TEST SETUP
            //localDownload(useStash = false)
            //temp path should then be toDelete.txt
            //apply etag to lfFile, delete temp path // it("should destroy temp file after etag download"), () => {}
            //TEST CONFIRMATION
            //test that lfFile etag is the same as remote
            //test that lfFile contents are different from remote
        }
        it("should download etag and copy of remote"), () => {
            //TEST SETUP
            //download (to temp) and grab etag
            //apply etag to lfFile
            //TEST CONFIRMATION
            //test that lfFile etag is the same as remote
            //test that lfFile contents is the same as remote
        }
    })
    describe("fileComparison()", () => {
        it("should accurately detect environment state (headless or gui avail). when headless, open diff in terminal"), () => {
            //TEST SETUP
            //helper.browserView = false
            //commandParameters.positionals.includes('ds')
            //TEST CONFIRMATION
            //check that commandParameters.response.console.log contains diff.response
        }
        it("should call the uss handler when calling fileComparision() for uss remote"), () => {
            //TEST SETUP
            //helper.browserView = true
            //commandParameters.positionals.includes('uss')
            //handlerUss.getFile2 returns "this is a uss file"
            //TEST CONFIRMATION
            //check that mfds = "this is a uss file"
        }
    })
    describe("makeEdits()", () => {
        it("should open local file in correct editor"), () => {
        //TEST SETUP
        // editor = true
        // ProcessUtils.openInEditor mock return nothing
        // this.promptUser(Prompt.doneEditing, tempPath) returns true
        //TEST CONFIRMATION
        // makeEdits returns true
        }

    })
    describe("uploadEdits()", () => {
        it("should successfully upload when etags are matching, then destroy temp - uss"), () => {
        //TEST SETUP
        // lfFile.fileType == 'uss'
        // await Upload.fileToUssFile returns successful response
        //TEST CONFIRMATION
        // check that this.destroyTempFile is called and uploadEdits() returns true
        }
        it("should return false when etag mismatch - ds"), () => {
            //TEST SETUP
            // lfFile.fileType == 'ds'
            // await Upload.fileToDataset returns unsuccessful mock of etag mismatch error
            //TEST CONFIRMATION
            // check that etagMismatch is called and uploadEdits() returns false
        }
        it("should return false when catching Upload.fileToDataset() thrown etag mismatch error- ds"), () => {
            //TEST SETUP
            // lfFile.fileType == 'ds'
            // await Upload.fileToDataset throws etag mismatch error
            //TEST CONFIRMATION
            // check that etagMismatch is called and uploadEdits() returns false
        }
        it("should throw an imperative error given unexpected command termination"), () => {
            //TEST SETUP
            // throw an error
            //TEST CONFIRMATION
            // check that error was thrown and error messages match
        }
    })
    describe("etagMismatch()", () => {
        it("should catch any thrown errors when user views remote's changes and decides not to continue uploading"), () => {
            //TEST SETUP
            // viewUpdatedRemote = true
            // mock this.fileComparison
            // continueToUpload = false
            // mock this.makeEdits
            // throw error
            //TEST CONFIRMATION
            // check that imperative error is thrown
        }
    })
    describe("destroyTempFile()", () => {
        it("should successfully destroy temp file once edits are successfully uploaded to remote"), () => {
            //TEST SETUP
            // create temp file
            // unlinkSync(tempPath)
            // success
            //TEST CONFIRMATION
            // confirm mock file no longer exists
        }
        it("should catch any error when destroying temp file"), () => {
            //TEST SETUP
            // unlinkSync throws error
            //TEST CONFIRMATION
            // check that imperative error is thrown
        }
    })
})