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

import { GuiResult, IHandlerParameters, ImperativeError, ProcessUtils, RestConstants, TextUtils } from "@zowe/imperative";
import {ILocalFile,
    EditUtilities} from "../../../../src/zosfiles/edit/Edit.utils";
import { mockHandlerParameters } from "@zowe/cli-test-utils";
import { EditDefinition } from "../../../../src/zosfiles/edit/Edit.definition";
import EditHandler from "../../../../src/zosfiles/edit/Edit.handler";
import { UNIT_TEST_PROFILES_ZOSMF, UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import * as path from 'path';

describe("Files Edit Group Handler", () => {
    describe("process method", () => {
        //Variable instantiation
        const dataSetName = "dataset";
        const dataSetPath = path.join(process.cwd(), "packages\\cli\\src\\zosfiles\\edit\\Edit.handler.ts");

        const commandParameters: IHandlerParameters = mockHandlerParameters({
            arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
            positionals: ["zos-files", "edit", "ds"],
            definition: EditDefinition,
            profiles: UNIT_TEST_PROFILES_ZOSMF
        });

        const localFile: ILocalFile = {
            tempPath: dataSetPath,
            fileName: dataSetName,
            fileType: "ds",
            guiAvail: true,
            zosResp: {
                apiResponse:{etag: 'remote etag'},
                success: true,
                commandResponse: ``
            }
        };

        //Mocks Setup
        const buildTempPathSpy = jest.spyOn(EditUtilities, "buildTempPath");
        const checkForStashSpy = jest.spyOn(EditUtilities, "checkForStash");
        const promptUserSpy = jest.spyOn(EditUtilities, "promptUser");
        const localDownloadSpy = jest.spyOn(EditUtilities, "localDownload");
        const uploadEditsSpy = jest.spyOn(EditUtilities, "uploadEdits");
        const guiAvailSpy = jest.spyOn(ProcessUtils, "isGuiAvailable");
        jest.spyOn(EditUtilities, "fileComparison").mockImplementation(jest.fn());
        jest.spyOn(EditUtilities, "makeEdits").mockImplementation(jest.fn());
        guiAvailSpy.mockImplementation(jest.fn(() => {
            return GuiResult.GUI_AVAILABLE;
        }));
        buildTempPathSpy.mockImplementation(jest.fn(async () => {
            return dataSetPath;
        }));
        checkForStashSpy.mockImplementation(jest.fn(async () => {
            return true;
        }));
        promptUserSpy.mockImplementation(jest.fn(async () => {
            return true;
        }));
        localDownloadSpy.mockImplementation(jest.fn(async () => {
            return localFile;
        }));
        uploadEditsSpy.mockImplementation(jest.fn(async () => {
            return true;
        }));

        //Handler Setup
        const handler = new EditHandler;
        commandParameters.arguments.dataSetName = dataSetName;
        const params = Object.assign({}, ...[commandParameters]);
        params.arguments = Object.assign({}, ...[commandParameters.arguments]);

        it("should make and upload edits successfully", async () => {
            await handler.process(params);
            expect(params.response.data.setObj).toHaveBeenCalledWith({
                success: true,
                commandResponse: TextUtils.chalk.green(
                    "Successfully uploaded edited file to mainframe"
                )});
        });
        it("should catch remote 404 error", async () => {
            localDownloadSpy.mockImplementation(jest.fn(async () => {
                throw new ImperativeError({
                    msg: "File not found on mainframe. Command terminated",
                    errorCode: String(RestConstants.HTTP_STATUS_404)
                });
            }));

            let caughtError;
            try {
                await handler.process(params);
            } catch(e) {
                caughtError = e;
            }
            expect(caughtError).toBeInstanceOf(ImperativeError);
        });
    });
});