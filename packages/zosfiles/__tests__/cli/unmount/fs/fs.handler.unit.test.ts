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

import { Unmount, IZosFilesResponse } from "../../../../src/api";
import FsHandler from "../../../../src/cli/unmount/fs/fs.handler";
import { ZosFilesBaseHandler } from "../../../../src/cli/ZosFilesBase.handler";

describe("FsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const unmountFs = jest.spyOn(Unmount, "fs");

    beforeEach(() => {
        unmountFs.mockClear();
        unmountFs.mockImplementation(async () => defaultReturn);
    });

    it("should call Unmount.fs", async () => {
        const handler = new FsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                fileSystemName: "ABCD",
            }
        };

        const dummySession = {
            lazyness: "(n.) An important quality for a developer to have."
        }; // I'm lazy and we don't actually need the object

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(unmountFs).toHaveBeenCalledTimes(1);
        expect(unmountFs).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.fileSystemName,
        );
        expect(response).toBe(defaultReturn);
    });
});
