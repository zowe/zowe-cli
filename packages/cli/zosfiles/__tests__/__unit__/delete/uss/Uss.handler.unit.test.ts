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

import { Delete, IZosFilesResponse } from "../../../../src/api";
import UssHandler from "../../../../src/cli/delete/uss/Uss.handler";
import { ZosFilesBaseHandler } from "../../../../src/cli/ZosFilesBase.handler";

describe("UssHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const deleteUssFileSpy = jest.spyOn(Delete, "ussFile");

    beforeEach(() => {
        deleteUssFileSpy.mockClear();
        deleteUssFileSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call Delete.ussFile", async () => {
        const handler = new UssHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                fileName: "ABCD"
            }
        };

        const dummySession = {
            lazyness: "(n.) An important quality for a developer to have."
        }; // I'm lazy and we don't actually need the object

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(deleteUssFileSpy).toHaveBeenCalledTimes(1);
        expect(deleteUssFileSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.fileName,
            undefined
        );
        expect(response).toBe(defaultReturn);
    });

});
