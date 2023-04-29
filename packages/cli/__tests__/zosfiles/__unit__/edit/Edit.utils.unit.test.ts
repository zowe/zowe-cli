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

import { mockHandlerParameters } from "@zowe/cli-test-utils";
import { AbstractSession, CliUtils, GuiResult, IHandlerParameters, ImperativeError, ProcessUtils } from "@zowe/imperative";
import { UNIT_TEST_ZOSMF_PROF_OPTS, UNIT_TEST_PROFILES_ZOSMF } from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { EditDefinition } from "../../../../src/zosfiles/edit/Edit.definition";
import { EditUtilities, ILocalFile, Prompt } from "../../../../src/zosfiles/edit/Edit.utils";
import { cloneDeep } from "lodash";
import * as fs from "fs";
import { Download, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import LocalfileDatasetHandler from "../../../../src/zosfiles/compare/lf-ds/LocalfileDataset.handler";
import { CompareBaseHelper } from "../../../../src/zosfiles/compare/CompareBaseHelper";
import LocalfileUssHandler from "../../../../src/zosfiles/compare/lf-uss/LocalfileUss.handler";

describe("Files Edit Utilities", () => {
    const commandParametersDs: IHandlerParameters = mockHandlerParameters({
        arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
        positionals: ["zos-files", "edit", "ds"],
        definition: EditDefinition,
        profiles: UNIT_TEST_PROFILES_ZOSMF
    });

    const commandParametersUss: IHandlerParameters = mockHandlerParameters({
        arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
        positionals: ["zos-files", "edit", "uss"],
        definition: EditDefinition,
        profiles: UNIT_TEST_PROFILES_ZOSMF
    });

    const localFileDs: ILocalFile = {
        tempPath: null,
        fileName: "TEST(DS)",
        fileType: "ds",
        guiAvail: true,
        zosResp: null
    };

    const localFileUSS: ILocalFile = {
        tempPath: null,
        fileName: "test_uss.jcl",
        fileType: "uss",
        guiAvail: true,
        zosResp: null
    };

    let zosResp: IZosFilesResponse = {
        apiResponse: {etag: 'remote etag'},
        commandResponse:'Successful download.',
        success: true
    }

    let caughtError: ImperativeError;
    let REAL_SESSION: AbstractSession;

    beforeEach(async () => {
        jest.resetAllMocks();
    });
    describe("buildTempPath()", () => {
        it("should be able to build the correct temp path with ext argument - uss", async () => {
            //TEST SETUP
            //create deep copy of base object, pass in uss lfFile (file name with underscores) to buildTempPath
            let localFile = cloneDeep(localFileUSS);

            //TEST CONFIRMATION
            // check that the returned string (string.split('.')[0]) contains only numbers and letters
            const response = await EditUtilities.buildTempPath(localFile, commandParametersUss);
            expect(response).toContain(".jcl");
            expect(response.split('\\').pop()?.split('.')[0]).toMatch(/^[A-Za-z0-9]*$/);
        })
        it("should be able to build the correct temp path with ext argument - ds", async () => {
            //TEST SETUP
            //create and modify deep copies of base objects
            let commandParameters = cloneDeep(commandParametersDs);
            let localFile = cloneDeep(localFileDs);
            commandParameters.arguments.extension = "jcl";

            //TEST CONFIRMATION
            const response = await EditUtilities.buildTempPath(localFile, commandParameters);
            expect(response).toContain(".jcl");
        })
        it("should be able to build the correct temp path with default ext (.txt) - ds", async () => {
            //TEST SETUP
            //create deep copy of base object
            let localFile = cloneDeep(localFileDs);

            //TEST CONFIRMATION
            const response = await EditUtilities.buildTempPath(localFile, commandParametersDs);
            expect(response).toContain(".txt");
        })
    })
    describe("checkForStash()", () => {
        const existsSyncSpy = jest.spyOn(fs, "existsSync");
        it("should detect the presence of a stash", async () => {
            //TEST SETUP
            existsSyncSpy.mockImplementation(jest.fn(() => {
                return true;
            }));

            //TEST CONFIRMATION
            const response = await EditUtilities.checkForStash("validPath");
            expect(response).toBeTruthy;
        })
        it("should catch an error when searching for stash", async () => {
            //TEST SETUP
            existsSyncSpy.mockImplementation(jest.fn(() => {
                throw new Error("ahh!");
            }));

            //TEST CONFIRMATION
            try {
                await EditUtilities.checkForStash("validPath");
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError).toBeInstanceOf(ImperativeError)
        })
    })
    describe("promptUser()", () => {
        const readPromptSpy = jest.spyOn(CliUtils, "readPrompt");
        describe("truthy prompt responses", () => {
            beforeEach(async () => {
                readPromptSpy.mockImplementation(jest.fn(async () => {
                    return "y";
                }));
            });
            it("should understand that user wants to use their stash - case Prompt.useStash", async() => {
                const response = await EditUtilities.promptUser(Prompt.useStash);
                expect(response).toBeTruthy;
            });
            it("should understand that user wants to upload edits despite remote changes - case Prompt.continueToUpload", async() => {
                const response = await EditUtilities.promptUser(Prompt.continueToUpload);
                expect(response).toBeTruthy;
            });
            it("should understand that user wants to view diff between mf and lf files - case Prompt.viewUpdatedRemote", async() => {
                const response = await EditUtilities.promptUser(Prompt.viewUpdatedRemote);
                expect(response).toBeTruthy;
            });
            it("should understand that user is done editing - case Prompt.doneEditing", async() => {
                readPromptSpy.mockImplementation(jest.fn(async () => {
                    return "done";
                }));
                const response = await EditUtilities.promptUser(Prompt.doneEditing);
                expect(response).toBeTruthy;
            });
        });
        describe("falsy prompt responses", () => {
            beforeEach(async () => {
                readPromptSpy.mockImplementation(jest.fn(async () => {
                    return "n";
                }));
            });
            it("should understand that user does NOT want to use their stash - case Prompt.useStash", async() => {
                const response = await EditUtilities.promptUser(Prompt.useStash);
                expect(response).toBeFalsy;
            });
            it("should understand that user does NOT want to upload edits despite remote changes - case Prompt.continueToUpload", async() => {
                const response = await EditUtilities.promptUser(Prompt.continueToUpload);
                expect(response).toBeFalsy;
            });
            it("should understand that user does NOT want to view diff between mf and lf files - case Prompt.viewUpdatedRemote", async() => {
                const response = await EditUtilities.promptUser(Prompt.viewUpdatedRemote);
                expect(response).toBeFalsy;
            });
        });
        describe("null prompt responses", () => {
            beforeEach(async () => {
                readPromptSpy.mockImplementation(jest.fn(async () => {
                    return null;
                }));
            });
            it("should timeout of the entire command because no user input - case Prompt.useStash", async() => {
                try {
                    await EditUtilities.promptUser(Prompt.useStash);
                } catch(e) {
                    caughtError = e;
                }
                expect(caughtError).toBeInstanceOf(ImperativeError);
            });
            it("should timeout of the entire command because no user input - case Prompt.doneEditing", async() => {
                try {
                    await EditUtilities.promptUser(Prompt.doneEditing);
                } catch(e) {
                    caughtError = e;
                }
                expect(caughtError.message).toContain("Command terminated");
            });
            it("should timeout of the entire command because no user input - case Prompt.continueToUpload", async() => {
                try {
                    await EditUtilities.promptUser(Prompt.continueToUpload);
                } catch(e) {
                    caughtError = e;
                }
                expect(caughtError).toBeInstanceOf(ImperativeError);
            });
            it("should timeout of the entire command because no user input - case Prompt.viewUpdatedRemote", async() => {
                try {
                    await EditUtilities.promptUser(Prompt.viewUpdatedRemote);
                } catch(e) {
                    caughtError = e;
                }
                expect(caughtError).toBeInstanceOf(ImperativeError);
            });
        });
    })
    describe("localDownload()", () => {
        jest.spyOn(EditUtilities, "destroyTempFile").mockImplementation(jest.fn());
        const downloadDataSetSpy = jest.spyOn(Download, "dataSet");
        const downloadUssFileSpy = jest.spyOn(Download, "ussFile");

        it("should apply etag from remote to ILocalFile without overwriting stash - [fileType = 'uss', useStash = true]", async () => {
            //TEST SETUP
            let localFile = cloneDeep(localFileUSS);
            downloadUssFileSpy.mockImplementation(jest.fn(async () => {
                return zosResp;
            }));

            //TEST CONFIRMATION
            //test that lfFile etag is the same as remote and that
            //test that lfFile contents are different from remote (wrote to temp location)
            const response = await EditUtilities.localDownload(REAL_SESSION, localFile, true);
            expect(response.zosResp?.apiResponse.etag).toContain('remote etag');
            expect(EditUtilities.destroyTempFile).toHaveBeenCalledTimes(1);
        })
        it("should download etag and copy of remote - [fileType = 'ds', useStash = false]", async () => {
            //TEST SETUP
            //download (to temp) AND grab etag
            let localFile = cloneDeep(localFileDs);
            localFile.tempPath = "temp";
            downloadDataSetSpy.mockImplementation(jest.fn(async () => {
                return zosResp;
            }));

            //TEST CONFIRMATION
            //test that lfFile etag is the same as remote
            //test that lfFile contents are the same as remote (did not write to temp location)
            const response = await EditUtilities.localDownload(REAL_SESSION, localFile, false);
            expect(response.zosResp?.apiResponse.etag).toContain('remote etag');
            expect(EditUtilities.destroyTempFile).toHaveBeenCalledTimes(0);
        })
    })
    describe("fileComparison()", () => {
        const guiAvailSpy = jest.spyOn(ProcessUtils, "isGuiAvailable");
        const getFile1Spy = jest.spyOn(LocalfileDatasetHandler.prototype, "getFile1");
        const getFile2DsSpy = jest.spyOn(LocalfileDatasetHandler.prototype, "getFile2");
        const getFile2UssSpy = jest.spyOn(LocalfileUssHandler.prototype, "getFile2");
        const getResponseSpy = jest.spyOn(CompareBaseHelper.prototype, "getResponse");
        const prepareContentSpy = jest.spyOn(CompareBaseHelper.prototype, "prepareContent");
        getFile1Spy.mockImplementation(jest.fn(async() => {
            return Buffer.from('bufferedString');
        }));
        getFile2DsSpy.mockImplementation(jest.fn(async() => {
            return Buffer.from('bufferedString');
        }));
        getFile2UssSpy.mockImplementation(jest.fn(async() => {
            return Buffer.from('bufferedString');
        }));
        getResponseSpy.mockImplementation(jest.fn(async() => {
            return zosResp;
        }));
        prepareContentSpy.mockImplementation(jest.fn(() => {
            return 'unbufferedString';
        }));

        it("should accurately detect environment state (headless or gui avail). when headless, open diff in terminal - ds", async () => {
            //TEST SETUP
            //ProcessUtils.isGuiAvailable() = NO_GUI_SSH = 1
            let commandParameters =  cloneDeep(commandParametersDs);
            commandParameters.response.console.log = jest.fn();
            guiAvailSpy.mockImplementation(jest.fn(() => {
                return GuiResult.NO_GUI_SSH;
            }));

            //TEST CONFIRMATION (testing for error only because hard to mock out diffResponse)
            try {
                await EditUtilities.fileComparison(REAL_SESSION, commandParameters);
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError.message).toContain('Diff');
        })
        it("when guiAvail, open diff in browser - ds", async () => {
            //TEST SETUP
            //ProcessUtils.isGuiAvailable() = GUI_AVAILABLE = 0
            let commandParameters =  cloneDeep(commandParametersDs);
            guiAvailSpy.mockImplementation(jest.fn(() => {
                return GuiResult.GUI_AVAILABLE;
            }));

            //TEST CONFIRMATION
            await EditUtilities.fileComparison(REAL_SESSION, commandParameters);
            expect(getFile2DsSpy).toBeCalledWith(undefined, expect.anything(), expect.objectContaining({
                "browserView": true
            }));
        })
        it("should call the uss handler when calling fileComparison() for uss remote", async () => {
            //TEST SETUP
            let commandParameters =  cloneDeep(commandParametersUss);
            commandParameters.response.console.log = jest.fn();

            //TEST CONFIRMATION - (testing for error only because hard to mock out diffResponse)
            try {
                await EditUtilities.fileComparison(REAL_SESSION, commandParameters);
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError.message).toContain('Diff');
        })
    })
    describe("makeEdits()", () => {
        it("should open in editor if one specified, otherwise skip to prompting", () => {})
        it("should open local file in correct editor", () => {
        //TEST SETUP
        // editor = true
        // ProcessUtils.openInEditor mock return nothing
        // this.promptUser(Prompt.doneEditing, tempPath) returns true
        //TEST CONFIRMATION
        // makeEdits returns true
        })
    })
    describe("uploadEdits()", () => {
        it("should successfully upload when etags are matching, then destroy temp - uss", () => {
        //TEST SETUP
        // lfFile.fileType == 'uss'
        // await Upload.fileToUssFile returns successful response
        //TEST CONFIRMATION
        // check that this.destroyTempFile is called and uploadEdits() returns true
        })
        it("should return false when etag mismatch - ds", () => {
            //TEST SETUP
            // lfFile.fileType == 'ds'
            // await Upload.fileToDataset returns unsuccessful mock of etag mismatch error
            //TEST CONFIRMATION
            // check that etagMismatch is called and uploadEdits() returns false
        })
        it("should return false when catching Upload.fileToDataset() thrown etag mismatch error- ds", () => {
            //TEST SETUP
            // lfFile.fileType == 'ds'
            // await Upload.fileToDataset throws etag mismatch error
            //TEST CONFIRMATION
            // check that etagMismatch is called and uploadEdits() returns false
        })
        it("should throw an imperative error given unexpected command termination", () => {
            //TEST SETUP
            // throw an error
            //TEST CONFIRMATION
            // check that error was thrown and error messages match
        })
    })
    describe("etagMismatch()", () => {
        it("should not open comparison if user answers no to prompt", () => {})
        it("should catch any thrown errors when user views remote's changes and decides not to continue uploading", () => {
            //TEST SETUP
            // viewUpdatedRemote = true
            // mock this.fileComparison
            // continueToUpload = false
            // mock this.makeEdits
            // throw error
            //TEST CONFIRMATION
            // check that imperative error is thrown
        })
    })
    describe("destroyTempFile()", () => {
        it("should successfully destroy temp file once edits are successfully uploaded to remote", () => {
            //TEST SETUP
            // create temp file
            // unlinkSync(tempPath)
            // success
            //TEST CONFIRMATION
            // confirm mock file no longer exists
        })
        it("should catch any error when destroying temp file", () => {
            //TEST SETUP
            // unlinkSync throws error
            //TEST CONFIRMATION
            // check that imperative error is thrown
        })
    })
})