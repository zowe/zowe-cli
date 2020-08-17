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

import { Delete, IZosFilesResponse } from "../../../../../../../packages/zosfiles/src";
import ZfsHandler from "../../../../src/delete/zfs/zfs.handler";
import { ZosFilesBaseHandler } from "../../../../src/ZosFilesBase.handler";

describe("ZfsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const deleteZfs = jest.spyOn(Delete, "zfs");

    beforeEach(() => {
        deleteZfs.mockClear();
        deleteZfs.mockImplementation(async () => defaultReturn);
    });

    it("should call Delete.zfs", async () => {
        const handler = new ZfsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                fileSystemName: "ABCD"
            }
        };

        const dummySession = {
            lazyness: "(n.) An important quality for a developer to have."
        }; // I'm lazy and we don't actually need the object

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(deleteZfs).toHaveBeenCalledTimes(1);
        expect(deleteZfs).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.fileSystemName
        );
        expect(response).toBe(defaultReturn);
    });
});
