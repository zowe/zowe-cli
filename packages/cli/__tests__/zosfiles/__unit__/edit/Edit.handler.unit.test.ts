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

        const zosErrorResp_etagMismatch = {
            apiResponse:[],
            success: false,
            commandResponse: 'z/OSMF REST API Error:\nRest API failure with HTTP(S) status 412\n',
        }

        it("should update lfFile etag without overwriting file contents (keeping stash)", () => {
            //TEST SETUP
            // set lfFile to some pre-made ILocalFile from this file (lfFile.guiAvail = true)
            // mock Utils.buildTempPath()
            // mock Utils.checkForStash() to return true
            // mock Utils.promptUser(Prompt.useStash) to return true
            // mock Utils.fileComparison()
            // mock Utils.localDownload() to return the same lfFile with an updated etag
            //TEST CONFIRMATION
            // check that pre-made lfFile doesn't have the same etag as remote but remote has same etag as updated lfFile
            // check that file contents haven't been overwritten to be same as remote
        })
        it("should catch any error during setup, stash and etag retrieval", () => {
            //TEST SETUP
            // set lfFile to some pre-made ILocalFile from this file (lfFile.guiAvail = false)
            // mock Utils.buildTempPath()
            // mock Utils.checkForStash() to return false
            // have Utils.localDownload() throw generic error
            //TEST CONFIRMATION
            //check that processWithSession throws error
        })
        it("should catch remote 404 error specifically ", () => {
            //TEST SETUP
            // set lfFile to some pre-made ILocalFile from this file (lfFile.guiAvail = false)
            // mock Utils.buildTempPath()
            // mock Utils.checkForStash() to return false
            // have Utils.localDownload() throw 404
            //TEST CONFIRMATION
            //check that processWithSession throws 404 error
        })
        it("should make and upload edits successfully", () => {
            //TEST SETUP
            // set lfFile to some pre-made ILocalFile from this file (lfFile.guiAvail = true)
            // mock Utils.buildTempPath()
            // mock Utils.checkForStash() to return true
            // mock Utils.promptUser(Prompt.useStash) to return true
            // mock Utils.fileComparison()
            // mock Utils.localDownload() to return the same lfFile with an updated etag
            // mock Utils.makeEdits() to return
            // mock Utils.uploadEdits() to return true
            //TEST CONFIRMATION
            // check that processWithSession returns IZosFilesResponse where IZosFilesResponse.commandResponse contains "uploaded edited file"
        });
    })
})