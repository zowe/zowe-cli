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
import { Download, IZosFilesResponse, Upload } from "@zowe/zos-files-for-zowe-sdk";
import LocalfileDatasetHandler from "../../../../src/zosfiles/compare/lf-ds/LocalfileDataset.handler";
import { CompareBaseHelper } from "../../../../src/zosfiles/compare/CompareBaseHelper";
import LocalfileUssHandler from "../../../../src/zosfiles/compare/lf-uss/LocalfileUss.handler";
import * as path from "path";

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

    commandParametersDs.arguments["dataSetName"] =  commandParametersUss.arguments["file"] = 'fake';

    const localFileDS: ILocalFile = {
        tempPath: null,
        fileName: "TEST(DS)",
        fileType: "ds",
        guiAvail: true,
        zosResp: null,
        encoding: null,
        conflict: false
    };

    const localFileUSS: ILocalFile = {
        tempPath: null,
        fileName: "test_uss.jcl",
        fileType: "uss",
        guiAvail: true,
        zosResp: null,
        encoding: null,
        conflict: false
    };

    const zosResp: IZosFilesResponse = {
        apiResponse: {etag: 'remote etag'},
        commandResponse:'Successful download.',
        success: true
    };

    const zosRespMisMatch: IZosFilesResponse = {
        apiResponse: {etag: 'remote etag'},
        commandResponse:'412 Failed download.',
        success: false
    };

    let caughtError: ImperativeError;
    let REAL_SESSION: AbstractSession;

    beforeEach(async () => {
        jest.resetAllMocks();
    });
    describe("buildTempPath()", () => {
        it("should be able to build the correct temp path with ext argument - uss", async () => {
            // check that the returned path includes uss filename
            const response = await EditUtilities.buildTempPath(localFileUSS, commandParametersUss);
            expect(response).toContain(".jcl");
            expect(path.parse(response).name).toContain(path.parse(localFileUSS.fileName).name);
        });
        it("should be able to build the correct temp path with ext argument - ds", async () => {
            //TEST SETUP
            const commandParameters = cloneDeep(commandParametersDs);
            commandParameters.arguments.extension = "jcl";

            //TEST CONFIRMATION
            const response = await EditUtilities.buildTempPath(localFileDS, commandParameters);
            expect(response).toContain(".jcl");
        });
        it("should be able to build the correct temp path with default ext (.txt) - ds", async () => {
            const response = await EditUtilities.buildTempPath(localFileDS, commandParametersDs);
            expect(response).toContain(".txt");
        });
    });
    describe("checkForStash()", () => {
        const existsSyncSpy = jest.spyOn(fs, "existsSync");
        it("should detect the presence of a stash", async () => {
            //TEST SETUP
            existsSyncSpy.mockImplementation(jest.fn(() => {
                return true;
            }));

            //TEST CONFIRMATION
            const response = await EditUtilities.checkForStash("validPath");
            expect(response).toBe(true);
        });
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
            expect(caughtError).toBeInstanceOf(ImperativeError);

        });
    });
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
                expect(response).toBe(true);
            });
            it("should understand that user wants to upload edits despite remote changes - case Prompt.continueToUpload", async() => {
                const response = await EditUtilities.promptUser(Prompt.continueToUpload);
                expect(response).toBe(true);
            });
            it("should understand that user wants to view diff between mf and lf files - case Prompt.viewUpdatedRemote", async() => {
                const response = await EditUtilities.promptUser(Prompt.viewUpdatedRemote);
                expect(response).toBe(true);
            });
            it("should understand that user wants to overwrite remote - case Prompt.overwriteRemote", async() => {
                const response = await EditUtilities.promptUser(Prompt.overwriteRemote);
                expect(response).toBe(true);
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
                expect(response).toBe(false);
            });
            it("should understand that user does NOT want to upload edits despite remote changes - case Prompt.continueToUpload", async() => {
                const response = await EditUtilities.promptUser(Prompt.continueToUpload);
                expect(response).toBe(false);
            });
            it("should understand that user does NOT want to view diff between mf and lf files - case Prompt.viewUpdatedRemote", async() => {
                const response = await EditUtilities.promptUser(Prompt.viewUpdatedRemote);
                expect(response).toBe(false);
            });
            it("should understand that user does NOT want to overwrite remote - case Prompt.overwriteRemote", async() => {
                const response = await EditUtilities.promptUser(Prompt.overwriteRemote);
                expect(response).toBe(false);
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
    });
    describe("localDownload()", () => {
        jest.spyOn(EditUtilities, "destroyTempFile").mockImplementation(jest.fn());
        const downloadDataSetSpy = jest.spyOn(Download, "dataSet");
        const downloadUssFileSpy = jest.spyOn(Download, "ussFile");

        it("should apply etag from remote to ILocalFile without overwriting stash - [fileType = 'uss', useStash = true]", async () => {
            //TEST SETUP
            downloadUssFileSpy.mockImplementation(jest.fn(async () => {
                return zosResp;
            }));

            //TEST CONFIRMATION
            //test that lfFile etag is the same as remote
            //test that lfFile contents are different from remote (wrote to temp location & called destroyTemp)
            const response = await EditUtilities.localDownload(REAL_SESSION, localFileUSS, true);
            expect(response.zosResp?.apiResponse.etag).toContain('remote etag');
            expect(EditUtilities.destroyTempFile).toHaveBeenCalledTimes(1);
        });
        it("should download etag and copy of remote - [fileType = 'ds', useStash = false]", async () => {
            //TEST SETUP
            //download (to temp) AND grab etag
            const localFile = cloneDeep(localFileDS);
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
        });
    });
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
            const commandParameters =  cloneDeep(commandParametersDs);
            commandParameters.response.console.log = jest.fn();
            guiAvailSpy.mockImplementation(jest.fn(() => {
                return GuiResult.NO_GUI_SSH;
            }));

            //TEST CONFIRMATION
            try {
                await EditUtilities.fileComparison(REAL_SESSION, commandParameters, localFileDS);
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError.message).toContain('Diff');
        });
        it("when guiAvail, open diff in browser - ds", async () => {
            //TEST SETUP
            guiAvailSpy.mockImplementation(jest.fn(() => {
                return GuiResult.GUI_AVAILABLE;
            }));

            //TEST CONFIRMATION
            await EditUtilities.fileComparison(REAL_SESSION, commandParametersDs, localFileDS);
            expect(getFile2DsSpy).toBeCalledWith(undefined, expect.anything(), expect.objectContaining({
                "browserView": true
            }));
        });
        it("should call the uss handler when calling fileComparison() for uss remote", async () => {
            //TEST SETUP
            const commandParameters =  cloneDeep(commandParametersUss);
            commandParameters.response.console.log = jest.fn();

            //TEST CONFIRMATION
            try {
                await EditUtilities.fileComparison(REAL_SESSION, commandParameters, localFileUSS);
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError.message).toContain('Diff');
        });
        it("should prompt the user when local and remote are different", async () => {
            //TEST SETUP
            const commandParameters =  cloneDeep(commandParametersDs);
            commandParameters.response.console.log = jest.fn();
            const promptUserSpy = jest.spyOn(EditUtilities, "promptUser").mockResolvedValueOnce(false);
            prepareContentSpy.mockImplementationOnce(jest.fn(() => {
                return 'anotherUnbufferedString';
            }));

            //TEST CONFIRMATION
            try {
                await EditUtilities.fileComparison(REAL_SESSION, commandParameters, localFileDS, true);
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError.message).toContain('Diff');
            expect(promptUserSpy).toHaveBeenCalledTimes(1);
        });
        it("should not prompt the user when local and remote are identical", async () => {
            //TEST SETUP
            const commandParameters =  cloneDeep(commandParametersDs);
            commandParameters.response.console.log = jest.fn();
            const promptUserSpy = jest.spyOn(EditUtilities, "promptUser");

            //TEST CONFIRMATION
            try {
                await EditUtilities.fileComparison(REAL_SESSION, commandParameters, localFileDS);
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError.message).toContain('Diff');
            expect(promptUserSpy).toHaveBeenCalledTimes(0);
        });
    });
    describe("makeEdits()", () => {
        const localFile = cloneDeep(localFileUSS);
        localFile.tempPath = 'randomTempPath';
        it("should open in editor if one specified, otherwise skip to prompting", async () => {
            const openInEditorSpy = jest.spyOn(ProcessUtils, "openInEditor").mockImplementation(jest.fn());
            await EditUtilities.makeEdits(localFile, 'editorPath');
            expect(openInEditorSpy).toBeCalledTimes(1);
        });
        it("should skip to prompting if no supplied editor", async () => {
            const promptUserSpy = jest.spyOn(EditUtilities, "promptUser");
            await EditUtilities.makeEdits(localFile, 'editorPath');
            expect(promptUserSpy).toBeCalledTimes(1);
        });
    });
    describe("uploadEdits()", () => {
        it("should successfully upload when etags are matching, then destroy temp - uss", async () => {
            //TEST SETUP
            const localFile = cloneDeep(localFileUSS);
            localFile.zosResp = zosResp;
            localFile.zosResp.apiResponse.etag = 'etag';
            jest.spyOn(EditUtilities, "destroyTempFile").mockImplementation();
            jest.spyOn(Upload, "fileToUssFile").mockImplementation(async() => {
                return zosResp;
            });
            jest.spyOn(EditUtilities, "makeEdits").mockImplementation(async () => {
                return true;
            });

            //TEST CONFIRMATION
            const response = await EditUtilities.uploadEdits(REAL_SESSION, commandParametersDs, localFile);
            expect(response).toStrictEqual([true, false]);  //[uploaded, canceled]
        });
        it("should catch an etag mismatch (with intent to continue editing) and be unsuccessful with upload - ds", async () => {
            //TEST SETUP
            const localFile = cloneDeep(localFileDS);
            localFile.zosResp = zosResp;
            localFile.zosResp.apiResponse.etag = 'etag';
            jest.spyOn(Upload, "fileToDataset").mockImplementation(async() => {
                return zosRespMisMatch;
            });
            jest.spyOn(EditUtilities, "makeEdits").mockImplementation(async () => {
                return true;
            });
            jest.spyOn(EditUtilities, "etagMismatch").mockImplementation(async () => {
                return [false, true]; //[uploaded, canceled]
            });
            //TEST CONFIRMATION
            const response = await EditUtilities.uploadEdits(REAL_SESSION, commandParametersDs, localFile);
            expect(EditUtilities.etagMismatch).toHaveBeenCalledTimes(1);
            expect(response).toStrictEqual([false, true]);  //[uploaded, canceled]
        });
        it("should catch an etag mismatch, continue editing, and then CANCEL upload - ds", async () => {
            //TEST SETUP
            const localFile = cloneDeep(localFileDS);
            localFile.zosResp = zosResp;
            localFile.zosResp.apiResponse.etag = 'etag';
            jest.spyOn(EditUtilities, "promptUser").mockImplementation(async() => {
                return false;
            });
            jest.spyOn(EditUtilities, "makeEdits").mockImplementation(async () => {
                return true;
            });
            jest.spyOn(EditUtilities, "uploadEdits").mockImplementation(async () => {
                return [false, true];
            });
            //TEST CONFIRMATION
            const response = await EditUtilities.uploadEdits(REAL_SESSION, commandParametersDs, localFile);
            expect(EditUtilities.uploadEdits).toHaveBeenCalledTimes(1);
            expect(response).toStrictEqual([false, true]);  //[uploaded, canceled]
        });
        it("should throw an imperative error given unexpected command termination - uss", async () => {
            //TEST SETUP
            const localFile = cloneDeep(localFileUSS);
            localFile.zosResp = zosResp;
            localFile.zosResp.apiResponse.etag = 'etag';
            jest.spyOn(Upload, "fileToUssFile").mockImplementation(async() => {
                throw Error("ahh!");
            });

            //TEST CONFIRMATION
            try {
                await EditUtilities.uploadEdits(REAL_SESSION, commandParametersUss, localFile);
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError).toBeInstanceOf(ImperativeError);
        });
    });
    describe("etagMismatch()", () => {
        beforeEach(()=>{
            jest.restoreAllMocks();
        });
        it("should not open comparison if user answers no to prompt after found etag mismatch- ds", async() => {
            //TEST SETUP
            // no stash in this scenario
            const localFile = cloneDeep(localFileDS);
            localFile.tempPath = 'fakePath';
            localFile.zosResp = zosRespMisMatch;
            localFile.zosResp.apiResponse.etag = 'etag';

            const fileComparisonSpy = jest.spyOn(EditUtilities, "fileComparison");

            jest.spyOn(Upload, "fileToDataset").mockImplementation(async() => {
                return zosRespMisMatch;
            });
            jest.spyOn(EditUtilities, "localDownload").mockImplementation(async () => {
                return localFile;
            });
            jest.spyOn(EditUtilities, "makeEdits").mockImplementation(async () => {
                return true;
            });
            jest.spyOn(EditUtilities, "promptUser").mockImplementation(async() => {
                return false;
            });
            jest.spyOn(EditUtilities, "etagMismatch").mockImplementation(async () => {
                return [true, false]; //[uploaded, canceled]
            });

            //TEST CONFIRMATION
            const response = await EditUtilities.uploadEdits(REAL_SESSION, commandParametersDs, localFile);
            expect(fileComparisonSpy).toHaveBeenCalledTimes(0);
            expect(response).toStrictEqual([true, false]);  //[uploaded, canceled]
        });

        it("should catch any thrown errors when user views remote's changes and decides not to continue uploading", async() => {
            const localFile = cloneDeep(localFileDS);
            localFile.tempPath = 'fakePath';
            //TEST SETUP
            jest.spyOn(EditUtilities, "promptUser").mockImplementation(async() => {
                return false;
            });
            jest.spyOn(EditUtilities, "localDownload").mockImplementation(async() => {
                localFile.zosResp = zosResp;
                return localFile;
            });
            jest.spyOn(EditUtilities, "makeEdits").mockImplementation(() => {
                throw Error("ahh!");
            });

            //TEST CONFIRMATION
            try {
                await EditUtilities.etagMismatch(REAL_SESSION, commandParametersDs, localFile);
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError).toBeInstanceOf(ImperativeError);
        });
        it("should catch thrown etag mismatch error and be unsuccessful with upload - uss", async () => {
            //TEST SETUP
            const localFile = cloneDeep(localFileUSS);
            localFile.zosResp = zosResp;
            localFile.zosResp.apiResponse.etag = 'etag';
            jest.spyOn(Upload, "fileToUssFile").mockImplementation(async() => {
                return zosRespMisMatch;
            });
            jest.spyOn(EditUtilities, "etagMismatch").mockImplementation(async () => {
                return [false, true];
            });

            //TEST CONFIRMATION
            await EditUtilities.uploadEdits(REAL_SESSION, commandParametersUss, localFile);
            expect(EditUtilities.etagMismatch).toHaveBeenCalledTimes(1);
        });
    });
    describe("destroyTempFile()", () => {
        it("should successfully destroy temp file", async () => {
            jest.spyOn(fs, "unlinkSync").mockImplementation();
            await EditUtilities.destroyTempFile('tempPath');
            expect(EditUtilities.destroyTempFile).not.toThrow(ImperativeError);
        });
        it("should catch any error when destroying temp file", async () => {
            jest.spyOn(fs, "unlinkSync").mockImplementation(() => {
                throw Error("ahh!");
            });
            try {
                await EditUtilities.destroyTempFile('tempPath');
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError).toBeInstanceOf(ImperativeError);
        });
    });
});
