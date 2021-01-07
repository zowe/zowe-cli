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

import { Rename, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import DsmHandler from "../../../../../src/zosfiles/rename/dsm/Dsm.handler";
import { ZosFilesBaseHandler } from "../../../../../src/zosfiles/ZosFilesBase.handler";

describe("DsmHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const renameSpy = jest.spyOn(Rename, "dataSetMember");

    beforeEach(() => {
        renameSpy.mockClear();
        renameSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call Rename.dataSetMember", async () => {
        const handler = new DsmHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const dataSetName = "DATA.SET.NAME";
        const beforeMemberName = "BEFORE";
        const afterMemberName = "AFTER";

        const commandParameters: any = {
            arguments: { dataSetName, beforeMemberName, afterMemberName }
        };

        const dummySession = {};

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(renameSpy).toHaveBeenCalledTimes(1);
        expect(renameSpy).toHaveBeenLastCalledWith(dummySession, dataSetName, beforeMemberName, afterMemberName);
        expect(response).toBe(defaultReturn);
    });
});
